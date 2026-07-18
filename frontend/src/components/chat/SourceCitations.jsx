import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, FileText } from 'lucide-react'

export default function SourceCitations({ sources }) {
  const [expanded, setExpanded] = useState(false)

  if (!sources || sources.length === 0) return null

  return (
    <div className="mt-2.5">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 transition-colors hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
      >
        <span>
          {sources.length} source{sources.length > 1 ? 's' : ''}
        </span>
        <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.15 }}>
          <ChevronDown size={13} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {sources.map((source, i) => (
                <div
                  key={`${source.document_id}-${i}`}
                  className="rounded-xl border border-neutral-200/80 bg-white p-3 text-xs shadow-soft dark:border-white/10 dark:bg-white/5 dark:shadow-none"
                >
                  <div className="mb-1.5 flex items-center gap-1.5 font-medium text-neutral-700 dark:text-neutral-200">
                    <FileText size={12} className="shrink-0 text-accent" />
                    <span className="truncate">{source.filename}</span>
                    <span className="ml-auto shrink-0 rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] font-normal text-neutral-500 dark:bg-white/10 dark:text-neutral-400">
                      p.{source.page_number}
                    </span>
                  </div>
                  <p className="line-clamp-3 leading-relaxed text-neutral-500 dark:text-neutral-400">
                    {source.snippet}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
