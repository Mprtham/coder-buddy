import { motion } from 'framer-motion'
import { Brain, Layers, Code2, Sparkles, ArrowRight } from 'lucide-react'

const AGENTS = [
  { icon: Brain,  label: 'Planner',   color: 'from-blue-500/20 to-blue-600/10', border: 'border-blue-500/30', text: 'text-blue-400', desc: 'Understands your idea' },
  { icon: Layers, label: 'Architect', color: 'from-violet-500/20 to-violet-600/10', border: 'border-violet-500/30', text: 'text-violet-400', desc: 'Designs the structure' },
  { icon: Code2,  label: 'Coder',     color: 'from-emerald-500/20 to-emerald-600/10', border: 'border-emerald-500/30', text: 'text-emerald-400', desc: 'Writes every file' },
]

const EXAMPLES = [
  { emoji: '📝', text: 'Build a todo app in Python with JSON storage' },
  { emoji: '🌐', text: 'Create a personal expense tracker web app' },
  { emoji: '🔌', text: 'Build a REST API with FastAPI and SQLite' },
  { emoji: '🎨', text: 'Create a weather dashboard in HTML/CSS/JS' },
]

export function EmptyState({ onPrompt }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-8 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg text-center"
      >
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30">
              <Sparkles size={28} className="text-white" />
            </div>
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 opacity-20 blur-md" />
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-2xl font-bold text-[#e8e8f5] mb-2">
          Meet your AI engineering team
        </h1>
        <p className="text-sm text-[#8888a8] mb-8 max-w-sm mx-auto leading-relaxed">
          Describe any software project — Coder Buddy will plan, architect, and write every file for you.
        </p>

        {/* Agent pipeline */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {AGENTS.map((a, i) => {
            const Icon = a.icon
            return (
              <div key={a.label} className="flex items-center gap-2">
                <div className={`flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl bg-gradient-to-b ${a.color} border ${a.border}`}>
                  <Icon size={16} className={a.text} />
                  <span className={`text-[11px] font-semibold ${a.text}`}>{a.label}</span>
                  <span className="text-[10px] text-[#55556b] text-center w-20 leading-tight">{a.desc}</span>
                </div>
                {i < AGENTS.length - 1 && (
                  <ArrowRight size={14} className="text-[#2a2a40] flex-shrink-0" />
                )}
              </div>
            )
          })}
        </div>

        {/* Example prompts */}
        <div className="text-left">
          <p className="text-xs font-medium text-[#55556b] uppercase tracking-wider mb-3 text-center">
            Try an example
          </p>
          <div className="grid grid-cols-1 gap-2">
            {EXAMPLES.map((ex, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                onClick={() => onPrompt(ex.text)}
                className="flex items-center gap-3 w-full p-3 rounded-xl bg-[#1a1a28] border border-[#2a2a40] hover:border-[#6366f1]/40 hover:bg-[#1e1e2e] transition-all text-left group"
              >
                <span className="text-base flex-shrink-0">{ex.emoji}</span>
                <span className="text-sm text-[#8888a8] group-hover:text-[#e8e8f5] transition-colors leading-snug">
                  {ex.text}
                </span>
                <ArrowRight
                  size={13}
                  className="ml-auto text-[#2a2a40] group-hover:text-[#6366f1] transition-colors flex-shrink-0"
                />
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
