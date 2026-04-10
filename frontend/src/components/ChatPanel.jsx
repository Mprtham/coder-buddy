import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Brain, Layers, Code2 } from 'lucide-react'
import { MessageBubble } from './MessageBubble'
import { EmptyState } from './EmptyState'
import { InputBox } from './InputBox'

const AGENT_ICONS = { Planner: Brain, Architect: Layers, Coder: Code2 }
const AGENT_COLORS = {
  Planner: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  Architect: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  Coder: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
}

function AgentStatusBar({ status }) {
  if (!status) return null
  const Icon = AGENT_ICONS[status.agent] || Loader2
  const cls = AGENT_COLORS[status.agent] || 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={`flex items-center gap-2.5 px-4 py-2 border-b border-[#1e1e2e] bg-[#111118]`}
    >
      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${cls}`}>
        <Icon size={11} />
        <span>{status.agent}</span>
      </div>
      <span className="text-xs text-[#8888a8] truncate">{status.message}</span>
      {status.step && status.total && (
        <span className="ml-auto text-[11px] text-[#55556b] font-mono flex-shrink-0">
          {status.step}/{status.total}
        </span>
      )}
      <Loader2 size={12} className="text-[#55556b] animate-spin flex-shrink-0" />
    </motion.div>
  )
}

export function ChatPanel({ messages, isStreaming, agentStatus, onSend, onStop, onClarify }) {
  const bottomRef = useRef(null)
  const containerRef = useRef(null)

  // Auto-scroll to bottom
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120
    if (isNearBottom || isStreaming) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isStreaming, agentStatus])

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#0d0d14]">
      {/* Agent status bar */}
      <AnimatePresence>
        {agentStatus && <AgentStatusBar status={agentStatus} />}
      </AnimatePresence>

      {/* Messages */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto"
      >
        {messages.length === 0 ? (
          <EmptyState onPrompt={onSend} />
        ) : (
          <div className="max-w-3xl mx-auto px-4 pt-6 pb-2">
            <AnimatePresence initial={false}>
              {messages.map(m => (
                <MessageBubble key={m.id} message={m} onClarify={onClarify} />
              ))}
            </AnimatePresence>
            <div ref={bottomRef} className="h-1" />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="max-w-3xl w-full mx-auto">
        <InputBox
          onSend={onSend}
          onStop={onStop}
          isStreaming={isStreaming}
          disabled={false}
        />
      </div>
    </div>
  )
}
