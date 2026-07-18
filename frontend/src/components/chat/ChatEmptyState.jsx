import { motion } from 'framer-motion'
import { FileUp, MessageSquareText, Sparkles } from 'lucide-react'

const SUGGESTIONS = [
  'Summarize the key points of this document',
  'What are the main conclusions?',
  'List any numbers, dates, or figures mentioned',
  'Explain this document like I\u2019m new to the topic',
]

export default function ChatEmptyState({ hasReadyDocuments, onSuggestionClick }) {
  if (!hasReadyDocuments) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex max-w-sm flex-col items-center"
        >
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-soft text-accent dark:bg-accent-softDark">
            <FileUp size={26} />
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-neutral-800 dark:text-neutral-100">
            Upload a document to begin
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
            Drag and drop a PDF anywhere on this page, or use the upload button in the sidebar.
            Once it finishes processing, you can ask questions and get answers with exact page citations.
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex max-w-md flex-col items-center"
      >
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-soft text-accent dark:bg-accent-softDark">
          <MessageSquareText size={26} />
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-neutral-800 dark:text-neutral-100">
          Ask anything about your documents
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
          Answers are grounded in your uploaded PDFs, with citations back to the exact page.
        </p>

        <div className="mt-6 grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => onSuggestionClick(s)}
              className="flex items-center gap-2 rounded-xl2 border border-neutral-200/80 bg-white px-3.5 py-3 text-left text-sm
                text-neutral-600 shadow-soft transition-all hover:-translate-y-0.5 hover:border-accent/30 hover:text-neutral-800
                dark:border-white/10 dark:bg-white/5 dark:text-neutral-300 dark:shadow-none dark:hover:border-accent/30 dark:hover:text-neutral-100"
            >
              <Sparkles size={13} className="shrink-0 text-accent" />
              <span className="line-clamp-2">{s}</span>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
