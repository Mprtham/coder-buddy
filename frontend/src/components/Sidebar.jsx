import { motion, AnimatePresence } from 'framer-motion'
import { Plus, MessageSquare, Sparkles, Clock, ChevronRight } from 'lucide-react'

function Logo() {
  return (
    <div className="flex items-center gap-3 px-4 py-4 border-b border-[#1e1e2e]">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 flex-shrink-0">
        <Sparkles size={15} className="text-white" />
      </div>
      <div>
        <h1 className="text-sm font-bold text-[#e8e8f5] leading-none">Coder Buddy</h1>
        <p className="text-[10px] text-[#55556b] mt-0.5">AI Engineering Team</p>
      </div>
    </div>
  )
}

function NewChatButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="mx-3 mt-3 flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#6366f1]/10 border border-[#6366f1]/20 text-[#6366f1] hover:bg-[#6366f1]/20 hover:border-[#6366f1]/40 transition-all group w-[calc(100%-24px)]"
    >
      <Plus size={15} className="group-hover:rotate-90 transition-transform duration-200" />
      <span className="text-sm font-medium">New Chat</span>
    </button>
  )
}

function HistoryItem({ chat, isActive, onClick }) {
  return (
    <motion.button
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={onClick}
      className={`w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all group ${
        isActive
          ? 'bg-[#1e1e2e] border border-[#2a2a40] text-[#e8e8f5]'
          : 'hover:bg-[#1a1a28] text-[#8888a8] hover:text-[#e8e8f5] border border-transparent'
      }`}
    >
      <MessageSquare size={13} className="flex-shrink-0 mt-0.5 opacity-60" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{chat.title}</p>
        <p className="text-[10px] text-[#55556b] mt-0.5">{formatRelative(chat.date)}</p>
      </div>
      {isActive && <ChevronRight size={12} className="flex-shrink-0 text-[#6366f1] mt-0.5" />}
    </motion.button>
  )
}

export function Sidebar({ chatHistory, currentChatId, onNewChat }) {
  return (
    <div className="w-60 flex-shrink-0 flex flex-col bg-[#111118] border-r border-[#1e1e2e] h-full overflow-hidden">
      <Logo />
      <NewChatButton onClick={onNewChat} />

      {/* History */}
      <div className="flex-1 overflow-y-auto mt-4 px-2 pb-4">
        {chatHistory.length > 0 ? (
          <>
            <div className="flex items-center gap-2 px-2 mb-2">
              <Clock size={11} className="text-[#3a3a55]" />
              <span className="text-[10px] text-[#3a3a55] uppercase tracking-wider font-medium">Recent</span>
            </div>
            <AnimatePresence>
              {chatHistory.map(chat => (
                <HistoryItem
                  key={chat.id}
                  chat={chat}
                  isActive={chat.id === currentChatId}
                  onClick={() => {}}
                />
              ))}
            </AnimatePresence>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-32 text-center px-4">
            <MessageSquare size={20} className="text-[#2a2a40] mb-2" />
            <p className="text-xs text-[#3a3a55]">No chats yet</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-[#1e1e2e] px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] text-[#55556b]">API Connected</span>
        </div>
      </div>
    </div>
  )
}

function formatRelative(date) {
  if (!date) return ''
  const d = date instanceof Date ? date : new Date(date)
  const diff = Date.now() - d.getTime()
  if (diff < 60_000) return 'Just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return d.toLocaleDateString()
}
