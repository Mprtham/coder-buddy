import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PanelRight, PanelRightClose } from 'lucide-react'
import { Sidebar } from './components/Sidebar'
import { ChatPanel } from './components/ChatPanel'
import { FilePanel } from './components/FilePanel'
import { useChat } from './hooks/useChat'
import { healthCheck } from './services/api'
import toast from 'react-hot-toast'

export default function App() {
  const {
    messages,
    chatHistory,
    currentChatId,
    isStreaming,
    files,
    agentStatus,
    sendMessage,
    submitClarification,
    stopGeneration,
    newChat,
  } = useChat()

  const [showFilePanel, setShowFilePanel] = useState(true)
  const [backendOk, setBackendOk] = useState(null)

  // Check backend on mount
  useEffect(() => {
    healthCheck().then(ok => {
      setBackendOk(ok)
      if (!ok) {
        toast.error('Backend not reachable. Start it with: python backend/api.py', {
          duration: 6000,
          icon: '⚠️',
        })
      }
    })
  }, [])

  // Auto-show file panel when files arrive
  useEffect(() => {
    if (files.length > 0) setShowFilePanel(true)
  }, [files.length])

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#0d0d14]">
      {/* Sidebar */}
      <Sidebar
        chatHistory={chatHistory}
        currentChatId={currentChatId}
        onNewChat={newChat}
      />

      {/* Main chat */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1e1e2e] bg-[#111118]">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[#e8e8f5]">
              {messages.length > 0
                ? chatHistory.find(c => c.id === currentChatId)?.title || 'New Chat'
                : 'New Chat'}
            </span>
            {isStreaming && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 animate-pulse">
                generating…
              </span>
            )}
          </div>
          <button
            onClick={() => setShowFilePanel(v => !v)}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
              showFilePanel
                ? 'bg-[#6366f1]/20 text-[#6366f1] border border-[#6366f1]/30'
                : 'text-[#55556b] hover:bg-[#1e1e2e] hover:text-[#e8e8f5] border border-transparent'
            }`}
            title="Toggle file panel"
          >
            {showFilePanel ? <PanelRightClose size={14} /> : <PanelRight size={14} />}
          </button>
        </div>

        {/* Chat + File panel */}
        <div className="flex-1 flex overflow-hidden">
          <ChatPanel
            messages={messages}
            isStreaming={isStreaming}
            agentStatus={agentStatus}
            onSend={sendMessage}
            onStop={stopGeneration}
            onClarify={submitClarification}
          />

          <AnimatePresence>
            {showFilePanel && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 320, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="overflow-hidden flex-shrink-0"
              >
                <FilePanel
                  files={files}
                  onFilesCleared={() => {}}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
