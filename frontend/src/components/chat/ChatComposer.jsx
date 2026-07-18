import { useEffect, useRef, useState } from 'react'
import { ArrowUp, Square } from 'lucide-react'

export default function ChatComposer({ disabled, isStreaming, onSend, onStop }) {
  const [value, setValue] = useState('')
  const textareaRef = useRef(null)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [value])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!value.trim() || disabled || isStreaming) return
    onSend(value)
    setValue('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="border-t border-neutral-200/70 bg-surface-subtle/80 px-4 py-4 backdrop-blur-sm dark:border-white/10 dark:bg-surface-dark/80 sm:px-8">
      <form onSubmit={handleSubmit} className="mx-auto flex max-w-3xl items-end gap-2.5">
        <div className="flex flex-1 items-end rounded-xl3 border border-neutral-200 bg-white px-4 py-2.5 shadow-soft transition-colors focus-within:border-accent/50 focus-within:ring-4 focus-within:ring-accent/10 dark:border-white/10 dark:bg-white/[0.06] dark:shadow-none">
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={disabled ? 'Upload a PDF to start chatting…' : 'Ask a question about your documents…'}
            className="max-h-40 flex-1 resize-none bg-transparent text-[15px] leading-relaxed text-neutral-800
              placeholder:text-neutral-400 focus:outline-none disabled:cursor-not-allowed dark:text-neutral-100
              dark:placeholder:text-neutral-500"
          />
        </div>

        {isStreaming ? (
          <button
            type="button"
            onClick={onStop}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-neutral-800 text-white
              transition-transform active:scale-95 dark:bg-white dark:text-neutral-900"
            aria-label="Stop generating"
          >
            <Square size={14} fill="currentColor" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={disabled || !value.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-white
              shadow-sm shadow-accent/30 transition-all active:scale-95 disabled:cursor-not-allowed
              disabled:bg-neutral-200 disabled:text-neutral-400 disabled:shadow-none dark:disabled:bg-white/10
              dark:disabled:text-neutral-600"
            aria-label="Send message"
          >
            <ArrowUp size={18} />
          </button>
        )}
      </form>
      <p className="mx-auto mt-2 max-w-3xl text-center text-[11px] text-neutral-400">
        AI can make mistakes. Verify important information against the source document.
      </p>
    </div>
  )
}
