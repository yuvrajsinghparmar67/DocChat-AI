import { Trash2 } from 'lucide-react'

export default function ChatHeader({ readyCount, selectedCount, messageCount, onClear }) {
  const scopeLabel =
    selectedCount === 0
      ? `Searching all ${readyCount} document${readyCount === 1 ? '' : 's'}`
      : `Searching ${selectedCount} of ${readyCount} document${readyCount === 1 ? '' : 's'}`

  return (
    <div className="glass-panel flex shrink-0 items-center justify-between border-b border-neutral-200/70 px-4 py-3.5 dark:border-white/10 sm:px-6">
      <div>
        <h1 className="text-[15px] font-semibold text-neutral-800 dark:text-neutral-100">Document Chat</h1>
        {readyCount > 0 && <p className="text-xs text-neutral-400">{scopeLabel}</p>}
      </div>

      {messageCount > 0 && (
        <button
          onClick={onClear}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-neutral-500
            transition-colors hover:bg-danger/10 hover:text-danger dark:text-neutral-400"
        >
          <Trash2 size={13} />
          Clear conversation
        </button>
      )}
    </div>
  )
}
