import { useCallback, useState } from 'react'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import DropOverlay from './components/DropOverlay'
import ChatPage from './pages/ChatPage'
import { useDocuments } from './context/DocumentsContext'
import { useFileDrop } from './hooks/useFileDrop'

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { addFiles } = useDocuments()

  const handleDrop = useCallback((fileList) => addFiles(fileList), [addFiles])
  const isDragging = useFileDrop(handleDrop)

  return (
    <div className="flex h-screen w-full overflow-hidden bg-surface-subtle dark:bg-surface-dark">
      <DropOverlay isVisible={isDragging} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onMenuClick={() => setSidebarOpen(true)} title="DocChat" />
        <main className="flex min-h-0 flex-1 flex-col">
          <ChatPage />
        </main>
      </div>
    </div>
  )
}
