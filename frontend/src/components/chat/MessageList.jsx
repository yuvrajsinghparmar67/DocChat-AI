import { useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble'
import ChatEmptyState from './ChatEmptyState'

export default function MessageList({ messages, hasReadyDocuments, onSuggestionClick }) {
  const bottomRef = useRef(null)
  const containerRef = useRef(null)
  const wasNearBottomRef = useRef(true)

  // Track whether the user is scrolled near the bottom so we don't yank
  // them back down if they've scrolled up to re-read something.
  const handleScroll = () => {
    const el = containerRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    wasNearBottomRef.current = distanceFromBottom < 120
  }

  useEffect(() => {
    if (wasNearBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [messages])

  if (messages.length === 0) {
    return (
      <ChatEmptyState hasReadyDocuments={hasReadyDocuments} onSuggestionClick={onSuggestionClick} />
    )
  }

  return (
    <div ref={containerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
