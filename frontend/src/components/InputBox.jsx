import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Square, Sparkles } from 'lucide-react'

const SHORTCUTS = [
  'todo app in Python',
  'REST API with FastAPI',
  'web dashboard in HTML/CSS/JS',
  'CLI tool in Python',
]

export function InputBox({ onSend, onStop, isStreaming, disabled }) {
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  const textareaRef = useRef(null)

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 180) + 'px'
  }, [value])

  const submit = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed || isStreaming) return
    onSend(trimmed)
    setValue('')
  }, [value, isStreaming, onSend])

  const onKeyDown = useCallback(
    e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        submit()
      }
    },
    [submit]
  )

  const fillShortcut = useCallback(text => {
    setValue(text)
    textareaRef.current?.focus()
  }, [])

  return (
    <div className="flex-shrink-0 border-t border-[#1e1e2e] bg-[#0d0d14] px-4 pt-3 pb-4">
      {/* Quick shortcuts */}
      <AnimatePresence>
        {!value && !isStreaming && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex gap-2 mb-3 overflow-x-auto pb-0.5 scrollbar-hide"
          >
            {SHORTCUTS.map((s, i) => (
              <button
                key={i}
                onClick={() => fillShortcut(s)}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1a1a28] border border-[#2a2a40] text-[11px] text-[#8888a8] hover:border-[#6366f1]/40 hover:text-[#e8e8f5] transition-all"
              >
                <Sparkles size={10} className="text-indigo-400" />
                {s}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input area */}
      <div
        className={`relative flex items-end gap-3 rounded-2xl border px-4 py-3 transition-all ${
          focused
            ? 'border-[#6366f1]/50 bg-[#1a1a28] shadow-lg shadow-indigo-500/5'
            : 'border-[#2a2a40] bg-[#1a1a28]'
        }`}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
          placeholder="Describe what you want to build…"
          rows={1}
          className="flex-1 bg-transparent text-sm text-[#e8e8f5] placeholder-[#3a3a55] resize-none outline-none leading-relaxed min-h-[24px] max-h-[180px] overflow-y-auto"
        />

        <div className="flex-shrink-0 flex items-center gap-2 pb-0.5">
          {isStreaming ? (
            <button
              onClick={onStop}
              className="w-8 h-8 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-all"
              title="Stop generation"
            >
              <Square size={12} fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={!value.trim() || disabled}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                value.trim() && !disabled
                  ? 'bg-[#6366f1] hover:bg-[#4f46e5] text-white shadow-lg shadow-indigo-500/20'
                  : 'bg-[#2a2a40] text-[#55556b] cursor-not-allowed'
              }`}
              title="Send (Enter)"
            >
              <Send size={13} />
            </button>
          )}
        </div>
      </div>

      <p className="text-[10px] text-[#3a3a55] text-center mt-2">
        Press <kbd className="px-1 py-0.5 rounded bg-[#1e1e2e] text-[#55556b] text-[9px] border border-[#2a2a40]">Enter</kbd> to send · <kbd className="px-1 py-0.5 rounded bg-[#1e1e2e] text-[#55556b] text-[9px] border border-[#2a2a40]">Shift+Enter</kbd> for new line
      </p>
    </div>
  )
}
