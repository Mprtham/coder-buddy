"""
Coder Buddy – FastAPI backend
Wraps the LangGraph agent pipeline and streams events via SSE.
"""
import io
import json
import os
import queue
import re
import sys
import threading
import time
import zipfile

# ── Ensure we always run from the project root ────────────────────────────
PROJECT_ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(PROJECT_ROOT_DIR)
sys.path.insert(0, PROJECT_ROOT_DIR)

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel as FBaseModel

from langchain_core.globals import set_verbose, set_debug
from langchain_groq import ChatGroq
from langgraph.prebuilt import create_react_agent

from agent.states import Plan, TaskPlan
from agent.prompts import planner_prompt, architect_prompt, coder_system_prompt
from agent.tools import (
    write_file, read_file, get_current_directory,
    list_files, PROJECT_ROOT, init_project_root,
)

set_verbose(False)
set_debug(False)

_groq_key = (
    os.getenv("GROQ_API_KEY") or
    os.getenv("Groq_API_Key") or
    os.getenv("groq_api_key") or
    ""
)
llm = ChatGroq(model="llama-3.1-8b-instant", api_key=_groq_key)

# ── FastAPI app ───────────────────────────────────────────────────────────
app = FastAPI(title="Coder Buddy API", version="1.0.0")

# CORS — allow localhost in dev + any deployed frontend via ALLOWED_ORIGINS env var
_default_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
]
_extra = os.getenv("ALLOWED_ORIGINS", "")
ALLOWED_ORIGINS = _default_origins + [o.strip() for o in _extra.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(FBaseModel):
    prompt: str
    context: dict = {}   # carries clarification answers when provided


# ── Intent classifier ────────────────────────────────────────────────────────
_VAGUE_KEYWORDS = [
    "website", "web app", "webapp", "portfolio", "landing page",
    "app", "application", "dashboard", "platform", "saas",
]
_DETAIL_KEYWORDS = [
    "with", "using", "that", "which", "python", "react", "fastapi",
    "html", "css", "javascript", "flask", "node", "crud", "api",
    "login", "auth", "database", "json", "sqlite", "todo", "expense",
    "weather", "calculator", "game", "cli", "rest",
]

def _needs_clarification(prompt: str) -> bool:
    """Return True if prompt is too vague to generate a good project."""
    p = prompt.lower().strip()
    words = p.split()
    # Short and contains a vague keyword but no detail keywords
    if len(words) <= 6:
        has_vague = any(kw in p for kw in _VAGUE_KEYWORDS)
        has_detail = any(kw in p for kw in _DETAIL_KEYWORDS)
        return has_vague and not has_detail
    return False


def _friendly_error(exc: Exception) -> str:
    """Convert raw exception messages into user-friendly text."""
    msg = str(exc)
    if "rate_limit" in msg.lower() or "429" in msg:
        return "The AI service is currently busy. Please try again in a moment."
    if "api_key" in msg.lower() or "authentication" in msg.lower():
        return "Service configuration error. Please contact support."
    if "tool_use_failed" in msg.lower() or "tool call" in msg.lower():
        return "The AI had trouble with a task. Retrying automatically…"
    if "json" in msg.lower() or "parse" in msg.lower():
        return "The AI returned an unexpected response. Retrying…"
    if "timeout" in msg.lower():
        return "The request timed out. Please try again."
    # Generic fallback — never show raw stack traces
    return "Something went wrong while generating your project. Please try again."


# ── SSE helpers ───────────────────────────────────────────────────────────
def _rate_limit_wait(exc: Exception) -> float:
    """Extract suggested wait time from a Groq 429 error, default 20s.
    Handles formats: '10.2s', '4m21.36s', '1m30s'
    """
    msg = str(exc)
    # e.g. "4m21.36s"
    m = re.search(r'(\d+)m(\d+\.?\d*)s', msg)
    if m:
        return float(m.group(1)) * 60 + float(m.group(2)) + 1.0
    # e.g. "10.2s"
    m = re.search(r'try again in (\d+\.?\d*)s', msg)
    if m:
        return float(m.group(1)) + 1.0
    return 20.0


def _is_rate_limit(exc: Exception) -> bool:
    msg = str(exc).lower()
    return '429' in msg or 'rate_limit_exceeded' in msg or 'rate limit' in msg


def emit(q: queue.Queue, event_type: str, **data):
    q.put(json.dumps({"type": event_type, **data}))


def sse_stream(q: queue.Queue):
    while True:
        item = q.get()
        if item is None:
            yield "data: [DONE]\n\n"
            break
        yield f"data: {item}\n\n"


# ── Agent runner (runs in background thread) ─────────────────────────────
def run_agent(prompt: str, q: queue.Queue):
    try:
        init_project_root()

        # ── Planner ──────────────────────────────────────────────────────
        emit(q, "agent_start", agent="Planner",
             message="Analyzing your request and creating a project plan…")
        plan: Plan | None = None
        for attempt in range(5):
            try:
                plan = llm.with_structured_output(Plan).invoke(planner_prompt(prompt))
                if not plan:
                    raise ValueError("Planner returned no result")
                break
            except Exception as exc:
                if _is_rate_limit(exc) and attempt < 4:
                    wait = _rate_limit_wait(exc)
                    emit(q, "rate_limit", agent="Planner", wait=round(wait),
                         message=f"Rate limit hit — retrying in {round(wait)}s…")
                    time.sleep(wait)
                else:
                    emit(q, "error", message=_friendly_error(exc))
                    q.put(None)
                    return
        emit(q, "agent_done", agent="Planner", data={
            "name": plan.name,
            "description": plan.description,
            "techstack": plan.techstack,
            "features": plan.features,
            "files": [f.model_dump() for f in plan.files],
        })

        # ── Architect ─────────────────────────────────────────────────────
        emit(q, "agent_start", agent="Architect",
             message="Designing the implementation plan…")
        task_plan: TaskPlan | None = None
        for attempt in range(5):
            try:
                task_plan = llm.with_structured_output(TaskPlan).invoke(
                    architect_prompt(plan=plan.model_dump_json())
                )
                if not task_plan:
                    raise ValueError("Architect returned no result")
                task_plan.plan = plan
                break
            except Exception as exc:
                if _is_rate_limit(exc) and attempt < 4:
                    wait = _rate_limit_wait(exc)
                    emit(q, "rate_limit", agent="Architect", wait=round(wait),
                         message=f"Rate limit hit — retrying in {round(wait)}s…")
                    time.sleep(wait)
                elif attempt < 4:
                    emit(q, "retry", agent="Architect", attempt=attempt + 1,
                         message="Retrying architecture design…")
                else:
                    emit(q, "error", message=_friendly_error(exc))
                    q.put(None)
                    return

        emit(q, "agent_done", agent="Architect", data={
            "steps": [s.model_dump() for s in task_plan.implementation_steps],
        })

        # ── Pre-check: ensure all directories exist ───────────────────────
        steps = task_plan.implementation_steps
        for step in steps:
            clean_path = step.filepath.lstrip("/\\")
            step.filepath = clean_path
            import pathlib as _pl
            target = PROJECT_ROOT / clean_path
            target.parent.mkdir(parents=True, exist_ok=True)

        # ── Coder ─────────────────────────────────────────────────────────
        for idx, step in enumerate(steps):
            emit(q, "agent_start", agent="Coder",
                 message=f"Writing {step.filepath}…",
                 step=idx + 1, total=len(steps), filepath=step.filepath)
            for attempt in range(5):
                try:
                    existing = read_file.run(step.filepath)
                    user_msg = (
                        f"Task: {step.task_description}\n"
                        f"File: {step.filepath}\n"
                        f"Existing content:\n{existing}\n"
                        "Use write_file(path, content) to save your changes."
                    )
                    react_agent = create_react_agent(llm, [read_file, write_file, list_files, get_current_directory])
                    react_agent.invoke({
                        "messages": [
                            {"role": "system", "content": coder_system_prompt()},
                            {"role": "user", "content": user_msg},
                        ]
                    })
                    content = read_file.run(step.filepath)
                    emit(q, "file_written", filepath=step.filepath, content=content,
                         step=idx + 1, total=len(steps))
                    break
                except Exception as exc:
                    if _is_rate_limit(exc) and attempt < 4:
                        wait = _rate_limit_wait(exc)
                        emit(q, "rate_limit", agent="Coder", filepath=step.filepath,
                             wait=round(wait),
                             message=f"Rate limit hit — retrying {step.filepath} in {round(wait)}s…")
                        time.sleep(wait)
                    else:
                        emit(q, "file_error", filepath=step.filepath,
                             message=f"Could not generate {step.filepath}. Continuing…")
                        break

        # ── Collect all files ─────────────────────────────────────────────
        files = []
        if PROJECT_ROOT.exists():
            for f in PROJECT_ROOT.rglob("*"):
                if f.is_file():
                    try:
                        files.append({
                            "path": str(f.relative_to(PROJECT_ROOT)).replace("\\", "/"),
                            "content": f.read_text(encoding="utf-8"),
                        })
                    except Exception:
                        pass
        emit(q, "done", files=files,
             message=f"Your project is ready 🚀 — {len(files)} file{'s' if len(files) != 1 else ''} generated.")

    except Exception as exc:
        emit(q, "error", message=_friendly_error(exc))
    finally:
        q.put(None)


# ── Routes ────────────────────────────────────────────────────────────────
def _build_enriched_prompt(prompt: str, context: dict) -> str:
    """Merge original prompt with clarification answers."""
    if not context:
        return prompt
    parts = [prompt]
    if context.get("design"):
        parts.append(f"Design style: {context['design']}")
    if context.get("users"):
        parts.append(f"Target users: {context['users']}")
    if context.get("features"):
        parts.append(f"Key features: {context['features']}")
    if context.get("stack"):
        parts.append(f"Tech stack preference: {context['stack']}")
    return ". ".join(parts) + "."


@app.post("/chat")
async def chat(req: ChatRequest):
    if not req.prompt.strip():
        raise HTTPException(400, "Prompt cannot be empty")

    # If context already provided (user answered clarification), skip check
    if not req.context and _needs_clarification(req.prompt):
        def _clarify_stream():
            payload = json.dumps({
                "type": "clarify",
                "message": "Before I start building, let me ask a few quick questions to make it perfect for you.",
                "questions": [
                    {
                        "id": "design",
                        "question": "What design style would you like?",
                        "options": ["Classy — clean & elegant", "Flashy — animations & modern UI", "Minimal — simple & fast", "Corporate — professional"],
                    },
                    {
                        "id": "users",
                        "question": "Who are your target users?",
                        "options": ["Just me (personal use)", "Small team", "General public", "Businesses / clients"],
                    },
                    {
                        "id": "features",
                        "question": "Any must-have features?",
                        "options": ["User login / authentication", "Data storage / database", "Charts & analytics", "Mobile-friendly (responsive)"],
                        "multi": True,
                    },
                    {
                        "id": "stack",
                        "question": "Preferred tech stack? (optional)",
                        "options": ["Python + Flask/FastAPI", "React + Node.js", "Plain HTML/CSS/JS", "No preference"],
                    },
                ],
            })
            yield f"data: {payload}\n\n"
            yield "data: [DONE]\n\n"
        return StreamingResponse(
            _clarify_stream(),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )

    enriched = _build_enriched_prompt(req.prompt, req.context)
    q: queue.Queue = queue.Queue()
    threading.Thread(target=run_agent, args=(enriched, q), daemon=True).start()
    return StreamingResponse(
        sse_stream(q),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.get("/files")
async def get_files():
    files = []
    if PROJECT_ROOT.exists():
        for f in PROJECT_ROOT.rglob("*"):
            if f.is_file():
                try:
                    files.append({
                        "path": str(f.relative_to(PROJECT_ROOT)).replace("\\", "/"),
                        "content": f.read_text(encoding="utf-8"),
                    })
                except Exception:
                    pass
    return {"files": files}


@app.delete("/files")
async def clear_files():
    import shutil
    if PROJECT_ROOT.exists():
        shutil.rmtree(PROJECT_ROOT)
    PROJECT_ROOT.mkdir(parents=True, exist_ok=True)
    return {"status": "cleared"}


@app.get("/download")
async def download():
    if not PROJECT_ROOT.exists():
        raise HTTPException(404, "No project generated yet")
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for f in PROJECT_ROOT.rglob("*"):
            if f.is_file():
                zf.write(f, f.relative_to(PROJECT_ROOT))
    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=generated_project.zip"},
    )


@app.get("/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port, reload=False)
