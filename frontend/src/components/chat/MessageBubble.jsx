import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { AlertCircle, Sparkles, User } from 'lucide-react'
import TypingIndicator from './TypingIndicator'
import SourceCitations from './SourceCitations'

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`flex w-full gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-soft
          ${isUser ? 'bg-neutral-800 text-white dark:bg-white dark:text-neutral-900' : 'bg-accent text-white'}`}
      >
        {isUser ? <User size={14} /> : <Sparkles size={14} />}
      </div>

      {/* Bubble */}
      <div className={`flex max-w-[85%] flex-col sm:max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-xl2 px-4 py-3 text-[15px] leading-relaxed
            ${
              isUser
                ? 'bg-accent text-white'
                : 'bg-white text-neutral-800 shadow-soft dark:bg-white/[0.06] dark:text-neutral-100 dark:shadow-none'
            }`}
        >
          {message.error ? (
            <div className="flex items-start gap-2 text-danger">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{message.error}</span>
            </div>
          ) : isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : message.content ? (
            <div className="prose-chat">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
            </div>
          ) : message.isStreaming ? (
            <TypingIndicator />
          ) : null}

          {!isUser && message.isStreaming && message.content && (
            <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse-dot bg-accent align-middle" />
          )}
        </div>

        {!isUser && !message.error && <SourceCitations sources={message.sources} />}
      </div>
    </motion.div>
  )
}
