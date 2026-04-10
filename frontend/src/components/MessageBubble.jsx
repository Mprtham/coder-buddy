import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Bot, AlertTriangle, Download, FolderOpen, Rocket, Clock } from 'lucide-react'
import { AgentCard, FileWrittenCard } from './AgentCard'

function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-2 py-2">
      <div className="flex gap-1">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="thinking-dot w-2 h-2 rounded-full bg-[#6366f1]"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
      <span className="text-xs text-[#55556b]">Thinking…</span>
    </div>
  )
}

function UserBubble({ message }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex justify-end gap-3 mb-6"
    >
      <div className="max-w-[75%]">
        <div className="bg-[#6366f1] text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed shadow-lg shadow-indigo-500/10">
          {message.content}
        </div>
        <p className="text-[10px] text-[#55556b] mt-1 text-right">
          {formatTime(message.ts)}
        </p>
      </div>
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#6366f1]/20 border border-[#6366f1]/30 flex items-center justify-center mt-0.5">
        <User size={14} className="text-[#6366f1]" />
      </div>
    </motion.div>
  )
}

function ClarifyCard({ event, onSubmit }) {
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)

  const toggle = (qId, option, multi) => {
    setAnswers(prev => {
      if (multi) {
        const cur = prev[qId] ? prev[qId].split(', ') : []
        const idx = cur.indexOf(option)
        const next = idx >= 0 ? cur.filter(o => o !== option) : [...cur, option]
        return { ...prev, [qId]: next.join(', ') }
      }
      return { ...prev, [qId]: option }
    })
  }

  const isSelected = (qId, option, multi) => {
    if (!answers[qId]) return false
    if (multi) return answers[qId].split(', ').includes(option)
    return answers[qId] === option
  }

  const canSubmit = event.questions.filter(q => !q.multi).every(q => answers[q.id])

  const handleSubmit = () => {
    if (!canSubmit || submitted) return
    setSubmitted(true)
    onSubmit?.(answers)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-2 space-y-4"
    >
      <p className="text-sm text-[#c8c8e8]">{event.message}</p>
      {event.questions.map(q => (
        <div key={q.id}>
          <p className="text-xs font-medium text-[#8888a8] mb-2">{q.question}</p>
          <div className="flex flex-wrap gap-2">
            {q.options.map(opt => (
              <button
                key={opt}
                disabled={submitted}
                onClick={() => toggle(q.id, opt, q.multi)}
                className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                  isSelected(q.id, opt, q.multi)
                    ? 'bg-[#6366f1] border-[#6366f1] text-white'
                    : 'bg-[#1a1a28] border-[#2a2a40] text-[#8888a8] hover:border-[#6366f1]/50 hover:text-[#e8e8f5]'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      ))}
      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`mt-1 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
            canSubmit
              ? 'bg-[#6366f1] hover:bg-[#4f46e5] text-white shadow-lg shadow-indigo-500/20'
              : 'bg-[#2a2a40] text-[#55556b] cursor-not-allowed'
          }`}
        >
          Generate my project →
        </button>
      )}
      {submitted && (
        <p className="text-xs text-indigo-400 animate-pulse">Building your project…</p>
      )}
    </motion.div>
  )
}

function RateLimitBadge({ event }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 mb-2">
      <Clock size={11} className="flex-shrink-0" />
      <span>{event.message || `Rate limit — retrying in ${event.wait}s…`}</span>
    </div>
  )
}

function AssistantBubble({ message, onClarify }) {
  const events = message.events || []
  const hasEvents = events.length > 0
  const isDone = events.some(e => e.type === 'done')
  const hasError = !!message.error
  const doneEvent = events.find(e => e.type === 'done')
  const fileCount = doneEvent?.files?.length || 0
  const clarifyEvent = events.find(e => e.type === 'clarify')

  // Group events: separate agent_start/done from file_written events
  const agentEvents = events.filter(e =>
    ['agent_start', 'agent_done', 'retry'].includes(e.type)
  )
  const fileEvents = events.filter(e =>
    ['file_written', 'file_error'].includes(e.type)
  )
  const rateLimitEvents = events.filter(e => e.type === 'rate_limit')

  // Build pairs of (start, done) per agent
  const agentPairs = []
  const seen = {}
  for (const e of agentEvents) {
    const key = e.agent
    if (e.type === 'agent_start') {
      seen[key] = { start: e, done: null }
    } else if (e.type === 'agent_done' && seen[key]) {
      seen[key].done = e
      agentPairs.push(seen[key])
      delete seen[key]
    } else if (e.type === 'retry') {
      // just push as-is
      agentPairs.push({ start: e, done: null })
    }
  }
  // Anything still pending
  Object.values(seen).forEach(p => agentPairs.push(p))

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex gap-3 mb-6"
    >
      {/* Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mt-0.5 shadow-lg shadow-indigo-500/20">
        <Bot size={14} className="text-white" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Agent name */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold text-[#e8e8f5]">Coder Buddy</span>
          <span className="text-[10px] text-[#55556b]">{formatTime(message.ts)}</span>
        </div>

        {/* Thinking state */}
        {message.isStreaming && !hasEvents && <ThinkingIndicator />}

        {/* Clarification questions */}
        {clarifyEvent && (
          <ClarifyCard event={clarifyEvent} onSubmit={onClarify} />
        )}

        {/* Error state */}
        {hasError && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-300 mb-3">
            <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-400 text-xs mb-0.5">Something went wrong</p>
              <p className="text-xs text-red-300/80">{message.error}</p>
            </div>
          </div>
        )}

        {/* Rate limit badges */}
        {rateLimitEvents.slice(-1).map((e, i) => (
          <RateLimitBadge key={i} event={e} />
        ))}

        {/* Agent cards */}
        {agentPairs.map((pair, i) => {
          const isLast = i === agentPairs.length - 1
          const e = pair.done
            ? { ...pair.done, message: pair.start?.message }
            : pair.start
          return (
            <AgentCard
              key={i}
              event={e}
              isActive={message.isStreaming && isLast && !pair.done}
            />
          )
        })}

        {/* File written list (shown under Coder section) */}
        {fileEvents.length > 0 && (
          <div className="ml-0 mb-2 mt-1">
            {fileEvents.map((e, i) => (
              <FileWrittenCard key={i} event={e} />
            ))}
          </div>
        )}

        {/* Done summary */}
        {isDone && fileCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <Rocket size={13} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-emerald-300">Your project is ready 🚀</p>
                <p className="text-[10px] text-emerald-400/60">{fileCount} file{fileCount !== 1 ? 's' : ''} generated</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
              <Download size={11} />
              <span>View in panel →</span>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

export function MessageBubble({ message, onClarify }) {
  if (message.role === 'user') return <UserBubble message={message} />
  return <AssistantBubble message={message} onClarify={onClarify} />
}

function formatTime(ts) {
  if (!ts) return ''
  const d = ts instanceof Date ? ts : new Date(ts)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
