import { useState, useCallback, useRef } from 'react'
import { streamChat } from '../services/api'

let _id = 0
const uid = () => `m_${++_id}`

const EXAMPLE_PROMPTS = [
  'Build a todo app in Python with add, complete, delete and list tasks saved in a JSON file',
  'Create a personal expense tracker web app in HTML, CSS and JavaScript',
  'Build a REST API in Python using FastAPI with CRUD endpoints for a student database',
  'Create a weather dashboard in React that shows temperature, humidity and wind speed',
  'Build a CLI password manager in Python with AES encryption',
]

export function useChat() {
  const [messages, setMessages] = useState([])
  const [chatHistory, setChatHistory] = useState([])
  const [currentChatId, setCurrentChatId] = useState(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [files, setFiles] = useState([])
  const [agentStatus, setAgentStatus] = useState(null)
  const abortRef = useRef(null)

  const updateMsg = useCallback((id, fn) => {
    setMessages(prev => prev.map(m => (m.id === id ? fn(m) : m)))
  }, [])

  const handleEvent = useCallback(
    (event, aiId) => {
      switch (event.type) {
        case 'agent_start':
          setAgentStatus({
            agent: event.agent,
            message: event.message,
            step: event.step,
            total: event.total,
            filepath: event.filepath,
          })
          updateMsg(aiId, m => ({ ...m, events: [...m.events, event] }))
          break

        case 'agent_done':
        case 'retry':
          updateMsg(aiId, m => ({ ...m, events: [...m.events, event] }))
          break

        case 'file_written':
          setFiles(prev => {
            const idx = prev.findIndex(f => f.path === event.filepath)
            const nf = { path: event.filepath, content: event.content }
            if (idx >= 0) {
              const next = [...prev]
              next[idx] = nf
              return next
            }
            return [...prev, nf]
          })
          updateMsg(aiId, m => ({ ...m, events: [...m.events, event] }))
          break

        case 'file_error':
          updateMsg(aiId, m => ({ ...m, events: [...m.events, event] }))
          break

        case 'done':
          if (event.files?.length) setFiles(event.files)
          setAgentStatus(null)
          updateMsg(aiId, m => ({
            ...m,
            events: [...m.events, event],
            isStreaming: false,
          }))
          break

        case 'error':
          setAgentStatus(null)
          updateMsg(aiId, m => ({
            ...m,
            events: [...m.events, event],
            isStreaming: false,
            error: event.message,
          }))
          break

        default:
          break
      }
    },
    [updateMsg]
  )

  const sendMessage = useCallback(
    async prompt => {
      if (isStreaming || !prompt.trim()) return

      const controller = new AbortController()
      abortRef.current = controller

      const userId = uid()
      const aiId = uid()

      setMessages(prev => [
        ...prev,
        { id: userId, role: 'user', content: prompt, ts: new Date() },
        { id: aiId, role: 'assistant', events: [], isStreaming: true, ts: new Date() },
      ])

      // Update history
      if (!currentChatId) {
        const chatId = uid()
        setCurrentChatId(chatId)
        setChatHistory(prev => [
          {
            id: chatId,
            title: prompt.slice(0, 48) + (prompt.length > 48 ? '…' : ''),
            date: new Date(),
          },
          ...prev,
        ])
      }

      setIsStreaming(true)
      setAgentStatus(null)

      try {
        await streamChat(prompt, {
          onEvent: e => handleEvent(e, aiId),
          signal: controller.signal,
        })
      } catch (err) {
        if (err.name !== 'AbortError') {
          updateMsg(aiId, m => ({
            ...m,
            isStreaming: false,
            error: err.message,
          }))
        }
      } finally {
        setIsStreaming(false)
        setAgentStatus(null)
        updateMsg(aiId, m => ({ ...m, isStreaming: false }))
      }
    },
    [isStreaming, currentChatId, handleEvent, updateMsg]
  )

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const newChat = useCallback(() => {
    setMessages([])
    setFiles([])
    setCurrentChatId(null)
    setAgentStatus(null)
  }, [])

  return {
    messages,
    chatHistory,
    currentChatId,
    isStreaming,
    files,
    agentStatus,
    sendMessage,
    stopGeneration,
    newChat,
    EXAMPLE_PROMPTS,
  }
}
