export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-1">
      <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-neutral-400 [animation-delay:-0.3s] dark:bg-neutral-500" />
      <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-neutral-400 [animation-delay:-0.15s] dark:bg-neutral-500" />
      <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-neutral-400 dark:bg-neutral-500" />
    </div>
  )
}
