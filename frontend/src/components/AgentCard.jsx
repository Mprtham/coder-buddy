import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Layers, Code2, CheckCircle2, XCircle, RefreshCw, Loader2 } from 'lucide-react'
import { useState } from 'react'

const AGENT_CONFIG = {
  Planner: {
    icon: Brain,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    dot: 'bg-blue-400',
    badge: 'bg-blue-500/20 text-blue-300',
  },
  Architect: {
    icon: Layers,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    dot: 'bg-violet-400',
    badge: 'bg-violet-500/20 text-violet-300',
  },
  Coder: {
    icon: Code2,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    dot: 'bg-emerald-400',
    badge: 'bg-emerald-500/20 text-emerald-300',
  },
}

function ThinkingDots() {
  return (
    <span className="inline-flex items-center gap-0.5 ml-1">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="thinking-dot w-1 h-1 rounded-full bg-current inline-block"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </span>
  )
}

export function AgentCard({ event, isActive = false }) {
  const [expanded, setExpanded] = useState(true)
  const cfg = AGENT_CONFIG[event.agent] || AGENT_CONFIG.Coder
  const Icon = cfg.icon

  const isDone = event.type === 'agent_done'
  const isError = event.type === 'error'
  const isRetry = event.type === 'retry'

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`rounded-xl border ${cfg.border} ${cfg.bg} overflow-hidden mb-2`}
    >
      {/* Header row */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors"
      >
        {/* Icon */}
        <div className={`flex-shrink-0 w-7 h-7 rounded-lg ${cfg.bg} border ${cfg.border} flex items-center justify-center`}>
          <Icon size={14} className={cfg.color} />
        </div>

        {/* Agent name + status */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold ${cfg.badge} px-2 py-0.5 rounded-full`}>
              {event.agent}
            </span>
            {isActive && !isDone && (
              <Loader2 size={11} className={`${cfg.color} animate-spin`} />
            )}
            {isDone && <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" />}
            {isError && <XCircle size={13} className="text-red-400 flex-shrink-0" />}
            {isRetry && <RefreshCw size={11} className="text-amber-400 flex-shrink-0" />}
          </div>
          <p className="text-xs text-[#8888a8] mt-0.5 truncate">
            {event.message || (isDone ? 'Completed' : isRetry ? `Retrying… (attempt ${event.attempt})` : '')}
            {isActive && !isDone && <ThinkingDots />}
          </p>
        </div>

        {/* Step indicator */}
        {event.step && event.total && (
          <div className="flex-shrink-0 text-right">
            <span className="text-[11px] text-[#55556b] font-mono">
              {event.step}/{event.total}
            </span>
            {/* Progress bar */}
            <div className="w-16 h-0.5 bg-[#2a2a40] rounded-full mt-1 overflow-hidden">
              <div
                className={`h-full rounded-full ${cfg.dot} transition-all duration-500`}
                style={{ width: `${(event.step / event.total) * 100}%` }}
              />
            </div>
          </div>
        )}
      </button>

      {/* Expandable content */}
      <AnimatePresence>
        {expanded && isDone && event.data && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 pt-0 border-t border-white/5">
              {event.agent === 'Planner' && event.data && (
                <PlannerSummary data={event.data} />
              )}
              {event.agent === 'Architect' && event.data && (
                <ArchitectSummary data={event.data} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function PlannerSummary({ data }) {
  return (
    <div className="mt-2 space-y-2">
      <div>
        <p className="text-xs font-semibold text-[#e8e8f5]">{data.name}</p>
        <p className="text-[11px] text-[#8888a8] mt-0.5">{data.description}</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {data.features?.slice(0, 4).map((f, i) => (
          <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-[#1e1e2e] text-[#8888a8] border border-[#2a2a40]">
            {f}
          </span>
        ))}
        {data.features?.length > 4 && (
          <span className="text-[10px] text-[#55556b]">+{data.features.length - 4} more</span>
        )}
      </div>
      <div className="flex items-center gap-3 text-[11px] text-[#55556b]">
        <span>Stack: <span className="text-[#8888a8]">{data.techstack}</span></span>
        <span>{data.files?.length} files</span>
      </div>
    </div>
  )
}

function ArchitectSummary({ data }) {
  return (
    <div className="mt-2 space-y-1">
      {data.steps?.map((step, i) => (
        <div key={i} className="flex items-center gap-2 text-[11px] text-[#8888a8]">
          <span className="text-[#55556b] font-mono w-4 text-right">{i + 1}.</span>
          <span className="font-mono text-[#6b8cff]">{step.filepath}</span>
        </div>
      ))}
    </div>
  )
}

export function FileWrittenCard({ event }) {
  const [expanded, setExpanded] = useState(false)
  const isError = event.type === 'file_error'

  return (
    <motion.div
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.15 }}
      className={`flex items-center gap-2.5 py-1.5 px-3 rounded-lg text-xs mb-1 ${
        isError
          ? 'bg-red-500/10 border border-red-500/20 text-red-400'
          : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
      }`}
    >
      {isError ? (
        <XCircle size={12} className="flex-shrink-0" />
      ) : (
        <CheckCircle2 size={12} className="flex-shrink-0" />
      )}
      <span className="font-mono flex-1 truncate">{event.filepath}</span>
      {isError && (
        <span className="text-[10px] text-red-300 truncate max-w-[160px]">{event.message}</span>
      )}
    </motion.div>
  )
}
