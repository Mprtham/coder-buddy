# 🚀 Coder Buddy – AI Multi-Agent Software Engineer

Coder Buddy is a production-ready AI-powered coding assistant that plans, designs, and generates complete software projects using a **multi-agent architecture**.

Unlike basic AI tools, Coder Buddy simulates a real engineering team with specialised agents working together to deliver structured, scalable code.

---

## ✨ Features

* 🧠 **Multi-Agent System**

  * Planner → Understands requirements
  * Architect → Designs system structure
  * Coder → Generates complete code

* 💬 **Modern Chat Interface**

  * Real-time interaction
  * Streaming responses
  * Syntax-highlighted code blocks

* 📁 **Project Generation**

  * Generates full project structures
  * File-wise output preview
  * Download-ready code

* 🎨 **Premium UI**

  * Built with React + TailwindCSS
  * Dark mode UI
  * Inspired by modern AI tools (ChatGPT, Cursor)

---

## 🏗️ Tech Stack

### Frontend

* React (Vite)
* TailwindCSS
* Framer Motion
* Lucide React

### Backend

* Python
* FastAPI
* LangGraph (Multi-agent orchestration)

### AI Integration

* Groq API (model: `openai/gpt-oss-120b`)

---

## 🧠 Architecture Overview

The system is designed as a **multi-agent pipeline**:

1. **Planner Agent**

   * Interprets user input
   * Breaks down requirements

2. **Architect Agent**

   * Designs folder structure
   * Defines system components

3. **Coder Agent**

   * Generates full implementation
   * Writes production-style code

This mimics a real-world software development workflow rather than a single AI response.

---

## 🚀 Getting Started (Local Setup)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/coder-buddy.git
cd coder-buddy
```

### 2. Backend Setup

Install `uv` if you don't have it:

```bash
pip install uv
```

Create and activate a virtual environment:

```bash
uv venv
```

```bash
# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate
```

Install dependencies:

```bash
uv pip install -r pyproject.toml
```

### 3. Environment Variables

Create a `.env` file in the project root:

```env
GROQ_API_KEY=your_groq_key_here
```

Get your free Groq API key at: https://console.groq.com/keys

### 4. Run Backend

```bash
python backend/api.py
```

Backend will run on:

```
http://localhost:8000
```

---

### 5. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend will run on:

```
http://localhost:5173
```

The frontend automatically proxies `/api` requests to the backend at `http://localhost:8000`.

---

## 🌐 Deployment Guide

### 🔹 Backend Deployment (Render / Railway)

1. Push code to GitHub

2. Go to Render or Railway

3. Create new Web Service

4. Set:

   * Build Command: `pip install uv && uv pip install -r pyproject.toml`
   * Start Command: `python backend/api.py`

5. Add environment variables:

   * `GROQ_API_KEY`

---

### 🔹 Frontend Deployment (Vercel)

1. Import the `Mprtham/coder-buddy` repo in Vercel
2. Set Root Directory to `frontend`
3. Vercel will auto-detect Vite — build command `npm run build` is set automatically
4. Add environment variable in Vercel dashboard:

   * `VITE_API_URL` → `https://your-backend.onrender.com` (your Render service URL)

5. After deploying, copy your Vercel URL (e.g. `https://coder-buddy.vercel.app`)
6. Go back to **Render → Environment** and add:

   * `ALLOWED_ORIGINS` → `https://coder-buddy.vercel.app`

   Then redeploy the Render service so CORS allows your frontend origin.

---

## 🔥 What Makes This Project Different

Most AI coding tools:

* Generate raw code in one step
* Lack structure
* Not production-oriented

**Coder Buddy is different because:**

✅ Uses **multi-agent architecture** (like a real engineering team)
✅ Produces **structured, modular codebases**
✅ Separates planning, architecture, and implementation
✅ Designed for **scalability and real-world usage**
✅ Includes **modern UI + backend API integration**

---

## 📸 UI Preview

* Chat-based interaction
* Agent workflow visualisation
* Code preview panel

---

## 📌 Future Improvements

* File editing capability
* GitHub integration
* Deploy generated projects automatically
* Multi-language support
* Team collaboration

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first.

---

## 👨‍💻 Author

Prathamesh Mishra
MSc Data Science & AI | Python | AI Systems | Data Analytics

---

## ⭐ Final Note

This project is built to demonstrate:

* AI system design
* Full-stack engineering
* Production-ready thinking

If you found this useful, give it a ⭐ on GitHub.
