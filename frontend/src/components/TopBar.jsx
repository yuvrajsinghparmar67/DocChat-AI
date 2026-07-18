import { Menu } from 'lucide-react'

export default function TopBar({ onMenuClick, title = 'Chat', rightAction = null }) {
  return (
    <header className="glass-panel sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-neutral-200/70 px-4 dark:border-white/10 lg:hidden">
      <button
        onClick={onMenuClick}
        className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-white/10"
        aria-label="Open menu"
      >
        <Menu size={18} />
      </button>
      <h1 className="flex-1 text-sm font-semibold">{title}</h1>
      {rightAction}
    </header>
  )
}
