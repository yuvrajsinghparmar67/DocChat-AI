import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { AlertCircle, Loader2, Sparkles, X } from 'lucide-react'
import { fetchSummary } from '../lib/api'
import { useDocuments } from '../context/DocumentsContext'

export default function SummaryModal({ document, onClose }) {
  const { updateDocumentSummary } = useDocuments()
  const [isLoading, setIsLoading] = useState(!document.summary)
  const [error, setError] = useState(null)
  const [summary, setSummary] = useState(document.summary || '')

  useEffect(() => {
    if (document.summary) return

    let cancelled = false
    setIsLoading(true)
    setError(null)

    fetchSummary(document.id)
      .then((res) => {
        if (cancelled) return
        setSummary(res.summary)
        updateDocumentSummary(document.id, res.summary)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err.message || 'Failed to generate summary')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document.id])

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          className="flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-xl3 bg-white shadow-softDark dark:bg-surface-darkSubtle"
        >
          <div className="flex items-center gap-3 border-b border-neutral-200/70 px-5 py-4 dark:border-white/10">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent dark:bg-accent-softDark">
              <Sparkles size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                {document.filename}
              </p>
              <p className="text-xs text-neutral-400">AI-generated summary</p>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/10"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          <div className="overflow-y-auto px-5 py-5">
            {isLoading && (
              <div className="flex flex-col items-center gap-3 py-10 text-neutral-400">
                <Loader2 size={22} className="animate-spin" />
                <p className="text-sm">Reading the document…</p>
              </div>
            )}

            {!isLoading && error && (
              <div className="flex flex-col items-center gap-2 py-10 text-center text-danger">
                <AlertCircle size={22} />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {!isLoading && !error && (
              <div className="prose-chat text-[14px] text-neutral-700 dark:text-neutral-200">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
