import { motion, AnimatePresence } from 'framer-motion'
import { FileUp } from 'lucide-react'

export default function DropOverlay({ isVisible }) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-accent/10 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.94, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="flex flex-col items-center gap-4 rounded-xl3 border-2 border-dashed border-accent bg-white px-14 py-12
              shadow-softDark dark:bg-surface-darkSubtle"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-soft text-accent dark:bg-accent-softDark">
              <FileUp size={28} />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">Drop your PDFs here</p>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Release to upload and start chatting</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
