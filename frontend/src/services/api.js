// In development: VITE_API_URL = http://localhost:8000  (set in frontend/.env)
// In production:  VITE_API_URL = https://your-backend.onrender.com  (set in Vercel env vars)
const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')

/**
 * Stream chat responses via SSE.
 * @param {string} prompt
 * @param {{ onEvent: (e: object) => void, signal?: AbortSignal }} opts
 */
export async function streamChat(prompt, { onEvent, signal } = {}) {
  const res = await fetch(`${BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
    signal,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => 'Unknown error')
    throw new Error(`Server error ${res.status}: ${text}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buf = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buf += decoder.decode(value, { stream: true })
      const lines = buf.split('\n')
      buf = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const raw = line.slice(6).trim()
        if (raw === '[DONE]') return
        try {
          onEvent?.(JSON.parse(raw))
        } catch (_) {}
      }
    }
  } finally {
    reader.releaseLock()
  }
}

/** Fetch all generated project files */
export async function fetchFiles() {
  const res = await fetch(`${BASE}/files`)
  if (!res.ok) throw new Error('Failed to fetch files')
  return res.json() // { files: [{path, content}] }
}

/** Delete all generated files */
export async function clearFiles() {
  await fetch(`${BASE}/files`, { method: 'DELETE' })
}

/** Trigger download of the generated project ZIP */
export async function downloadProject() {
  const res = await fetch(`${BASE}/download`)
  if (!res.ok) throw new Error('No project to download')
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'generated_project.zip'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** Health check */
export async function healthCheck() {
  try {
    const res = await fetch(`${BASE}/health`)
    return res.ok
  } catch {
    return false
  }
}
