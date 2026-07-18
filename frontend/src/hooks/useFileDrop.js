import { useEffect, useRef, useState } from 'react'

/**
 * Tracks drag-and-drop of files over the whole window and invokes
 * `onDrop(fileList)` when the user releases. Uses a counter to correctly
 * handle dragenter/dragleave firing on nested child elements.
 */
export function useFileDrop(onDrop) {
  const [isDragging, setIsDragging] = useState(false)
  const dragCounter = useRef(0)

  useEffect(() => {
    const isFileDrag = (e) => Array.from(e.dataTransfer?.types || []).includes('Files')

    const handleDragEnter = (e) => {
      if (!isFileDrag(e)) return
      e.preventDefault()
      dragCounter.current += 1
      setIsDragging(true)
    }

    const handleDragOver = (e) => {
      if (!isFileDrag(e)) return
      e.preventDefault()
    }

    const handleDragLeave = (e) => {
      if (!isFileDrag(e)) return
      e.preventDefault()
      dragCounter.current -= 1
      if (dragCounter.current <= 0) {
        dragCounter.current = 0
        setIsDragging(false)
      }
    }

    const handleDrop = (e) => {
      if (!isFileDrag(e)) return
      e.preventDefault()
      dragCounter.current = 0
      setIsDragging(false)
      if (e.dataTransfer?.files?.length) {
        onDrop(e.dataTransfer.files)
      }
    }

    window.addEventListener('dragenter', handleDragEnter)
    window.addEventListener('dragover', handleDragOver)
    window.addEventListener('dragleave', handleDragLeave)
    window.addEventListener('drop', handleDrop)

    return () => {
      window.removeEventListener('dragenter', handleDragEnter)
      window.removeEventListener('dragover', handleDragOver)
      window.removeEventListener('dragleave', handleDragLeave)
      window.removeEventListener('drop', handleDrop)
    }
  }, [onDrop])

  return isDragging
}
