import { Component } from 'react'
import { AlertTriangle } from 'lucide-react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    // In a real deployment this would report to an error-tracking service.
    console.error('Unhandled UI error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-surface-subtle px-6 text-center dark:bg-surface-dark">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/10 text-danger">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">Something went wrong</h1>
            <p className="mt-1 max-w-sm text-sm text-neutral-500 dark:text-neutral-400">
              The app hit an unexpected error. Reloading the page usually fixes this.
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
          >
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
