import { useCallback, useRef, useState } from 'react'
import { streamChat } from '../lib/api'

let messageIdCounter = 0
function nextId() {
  messageIdCounter += 1
  return `msg-${messageIdCounter}-${Date.now()}`
}

/**
 * Owns the chat conversation: message list, streaming state, and the
 * abort controller for in-flight requests. `documentIds` scopes retrieval
 * to a subset of uploaded documents (null/empty = search all ready docs).
 */
export function useChat(documentIds) {
  const [messages, setMessages] = useState([])
  const [isStreaming, setIsStreaming] = useState(false)
  const abortControllerRef = useRef(null)

  const updateMessage = useCallback((id, updater) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? updater(m) : m)))
  }, [])

  const sendMessage = useCallback(
    async (text) => {
      const trimmed = text.trim()
      if (!trimmed || isStreaming) return

      const userMessage = { id: nextId(), role: 'user', content: trimmed }
      const assistantId = nextId()
      const assistantMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        sources: [],
        isStreaming: true,
        error: null,
      }

      // History sent to the backend is everything *before* this turn.
      const history = messages
        .filter((m) => !m.error)
        .map((m) => ({ role: m.role, content: m.content }))

      setMessages((prev) => [...prev, userMessage, assistantMessage])
      setIsStreaming(true)

      const controller = new AbortController()
      abortControllerRef.current = controller

      await streamChat({
        message: trimmed,
        documentIds: documentIds && documentIds.length > 0 ? documentIds : null,
        history,
        signal: controller.signal,
        onSources: (sources) => {
          updateMessage(assistantId, (m) => ({ ...m, sources }))
        },
        onToken: (token) => {
          updateMessage(assistantId, (m) => ({ ...m, content: m.content + token }))
        },
        onDone: () => {
          updateMessage(assistantId, (m) => ({ ...m, isStreaming: false }))
          setIsStreaming(false)
        },
        onError: (message) => {
          updateMessage(assistantId, (m) => ({ ...m, isStreaming: false, error: message }))
          setIsStreaming(false)
        },
      })
    },
    [messages, isStreaming, documentIds, updateMessage]
  )

  const stopStreaming = useCallback(() => {
    abortControllerRef.current?.abort()
    setIsStreaming(false)
    setMessages((prev) => prev.map((m) => (m.isStreaming ? { ...m, isStreaming: false } : m)))
  }, [])

  const clearConversation = useCallback(() => {
    abortControllerRef.current?.abort()
    setIsStreaming(false)
    setMessages([])
  }, [])

  return { messages, isStreaming, sendMessage, stopStreaming, clearConversation }
}
