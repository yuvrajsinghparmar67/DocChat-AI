import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, MessageSquareText, Plus, RefreshCw, Sparkles, Trash2, X } from 'lucide-react'
import { useDocuments } from '../context/DocumentsContext'
import ThemeToggle from './ui/ThemeToggle'
import StatusDot from './ui/StatusDot'
import SummaryModal from './SummaryModal'

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function DocumentRow({ doc, onOpenSummary }) {
  const { removeDocument, selectedDocumentIds, toggleDocumentSelection } = useDocuments()
  const isSelected = selectedDocumentIds.length === 0 || selectedDocumentIds.includes(doc.id)

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.2 }}
      className="group"
    >
      <button
        onClick={() => toggleDocumentSelection(doc.id)}
        disabled={doc.status !== 'ready'}
        title={doc.status === 'ready' ? 'Click to include/exclude from chat search' : doc.status}
        className={`flex w-full items-center gap-3 rounded-xl2 border px-3 py-2.5 text-left transition-colors
          ${
            isSelected
              ? 'border-accent/30 bg-accent-soft dark:border-accent/30 dark:bg-accent-softDark'
              : 'border-transparent bg-surface-subtle hover:bg-surface-muted dark:bg-white/5 dark:hover:bg-white/10'
          }
          disabled:cursor-default`}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-soft dark:bg-white/10 dark:shadow-none">
          <FileText size={16} className="text-accent" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-neutral-800 dark:text-neutral-100">{doc.filename}</p>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
            <StatusDot status={doc.status} />
            <span className="capitalize">{doc.status}</span>
            {doc.status === 'ready' && (
              <>
                <span>·</span>
                <span>{doc.page_count}p</span>
              </>
            )}
            <span>·</span>
            <span>{formatSize(doc.size_bytes)}</span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          {doc.status === 'ready' && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation()
                onOpenSummary(doc)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.stopPropagation()
                  onOpenSummary(doc)
                }
              }}
              className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 hover:bg-accent/10 hover:text-accent"
              aria-label={`Summarize ${doc.filename}`}
            >
              <Sparkles size={14} />
            </span>
          )}
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation()
              removeDocument(doc.id)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.stopPropagation()
                removeDocument(doc.id)
              }
            }}
            className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 hover:bg-danger/10 hover:text-danger"
            aria-label={`Delete ${doc.filename}`}
          >
            <Trash2 size={14} />
          </span>
        </div>
      </button>
      {doc.status === 'error' && doc.error_message && (
        <p className="mt-1 px-3 text-xs text-danger">{doc.error_message}</p>
      )}
    </motion.li>
  )
}

export default function Sidebar({ isOpen, onClose }) {
  const { documents, uploadingFiles, addFiles, dismissUploadError, loadError, refreshDocuments, isLoading } =
    useDocuments()
  const fileInputRef = useRef(null)
  const [summaryDoc, setSummaryDoc] = useState(null)

  const handleFileChange = (e) => {
    if (e.target.files?.length) {
      addFiles(e.target.files)
      e.target.value = ''
    }
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-30 bg-black/30 backdrop-blur-xs lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[300px] shrink-0 flex-col border-r border-neutral-200/70
          bg-surface-light transition-transform duration-300 ease-out
          dark:border-white/10 dark:bg-surface-darkSubtle
          lg:static lg:z-auto lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Brand header */}
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-white shadow-sm shadow-accent/30">
              <MessageSquareText size={16} />
            </div>
            <span className="text-[15px] font-semibold tracking-tight">DocChat</span>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-white/10 lg:hidden"
          >
            <X size={16} />
          </button>
        </div>

        {/* Upload trigger */}
        <div className="px-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-xl2 border border-dashed
              border-accent/40 bg-accent-soft/60 py-3 text-sm font-medium text-accent
              transition-colors hover:border-accent/70 hover:bg-accent-soft
              dark:border-accent/30 dark:bg-accent-softDark dark:hover:border-accent/60"
          >
            <Plus size={16} />
            Upload PDF
          </button>
        </div>

        {/* Load error banner */}
        {loadError && (
          <div className="mx-4 mt-3 flex items-center justify-between gap-2 rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">
            <span className="truncate">{loadError}</span>
            <button onClick={refreshDocuments} className="flex shrink-0 items-center gap-1 font-medium">
              <RefreshCw size={11} />
              Retry
            </button>
          </div>
        )}

        {/* Upload progress / errors */}
        {uploadingFiles.length > 0 && (
          <ul className="mt-3 space-y-2 px-4">
            {uploadingFiles.map((f) => (
              <li
                key={f.tempId}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs
                  ${f.error ? 'bg-danger/10 text-danger' : 'bg-neutral-100 text-neutral-600 dark:bg-white/5 dark:text-neutral-300'}`}
              >
                <span className="truncate">{f.error ? `${f.name}: ${f.error}` : `Uploading ${f.name}…`}</span>
                {f.error && (
                  <button onClick={() => dismissUploadError(f.tempId)} className="ml-2 shrink-0">
                    <X size={12} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* Document list */}
        <div className="mt-4 flex-1 overflow-y-auto px-4 pb-4">
          <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-neutral-400">
            Documents {documents.length > 0 && `(${documents.length})`}
          </p>
          {isLoading ? (
            <ul className="space-y-1.5">
              {[0, 1, 2].map((i) => (
                <li key={i} className="flex items-center gap-3 rounded-xl2 px-3 py-2.5">
                  <div className="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-neutral-200 dark:bg-white/10" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-3/4 animate-pulse rounded bg-neutral-200 dark:bg-white/10" />
                    <div className="h-2.5 w-1/2 animate-pulse rounded bg-neutral-200 dark:bg-white/10" />
                  </div>
                </li>
              ))}
            </ul>
          ) : documents.length === 0 ? (
            <div className="mt-8 flex flex-col items-center px-4 text-center">
              <FileText size={28} className="mb-2 text-neutral-300 dark:text-neutral-600" />
              <p className="text-xs text-neutral-400">No documents yet. Upload a PDF to get started.</p>
            </div>
          ) : (
            <ul className="space-y-1.5">
              {documents.map((doc) => (
                <DocumentRow key={doc.id} doc={doc} onOpenSummary={setSummaryDoc} />
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-neutral-200/70 px-5 py-3.5 dark:border-white/10">
          <span className="text-xs text-neutral-400">v1.0.0</span>
          <ThemeToggle />
        </div>
      </aside>

      {summaryDoc && <SummaryModal document={summaryDoc} onClose={() => setSummaryDoc(null)} />}
    </>
  )
}
