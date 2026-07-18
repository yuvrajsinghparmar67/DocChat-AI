const COLORS = {
  ready: 'bg-success',
  processing: 'bg-warning animate-pulse',
  error: 'bg-danger',
}

export default function StatusDot({ status }) {
  return <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${COLORS[status] || 'bg-neutral-400'}`} />
}
