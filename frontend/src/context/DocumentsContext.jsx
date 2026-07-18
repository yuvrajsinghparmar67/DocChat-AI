import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { deleteDocument, fetchDocuments, uploadDocument } from '../lib/api'

const DocumentsContext = createContext(null)

const POLL_INTERVAL_MS = 2500

export function DocumentsProvider({ children }) {
  const [documents, setDocuments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  // Per-file upload progress/errors, keyed by a client-side temp id.
  const [uploadingFiles, setUploadingFiles] = useState([])
  // Which document ids are toggled "on" for chat retrieval. Empty = all ready docs.
  const [selectedDocumentIds, setSelectedDocumentIds] = useState([])

  const pollRef = useRef(null)

  const refreshDocuments = useCallback(async () => {
    try {
      const docs = await fetchDocuments()
      setDocuments(docs)
      setLoadError(null)
      return docs
    } catch (err) {
      setLoadError(err.message || 'Failed to load documents')
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    refreshDocuments()
  }, [refreshDocuments])

  // Poll while any document is still "processing" so the UI updates to
  // "ready" or "error" without the user needing to refresh.
  useEffect(() => {
    const hasProcessing = documents.some((d) => d.status === 'processing')
    if (hasProcessing && !pollRef.current) {
      pollRef.current = setInterval(refreshDocuments, POLL_INTERVAL_MS)
    }
    if (!hasProcessing && pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [documents, refreshDocuments])

  const addFiles = useCallback(
    async (files) => {
      const pdfFiles = Array.from(files).filter((f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'))
      if (pdfFiles.length === 0) return

      const tempEntries = pdfFiles.map((file) => ({
        tempId: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: file.name,
        error: null,
      }))
      setUploadingFiles((prev) => [...prev, ...tempEntries])

      await Promise.all(
        pdfFiles.map(async (file, i) => {
          const tempId = tempEntries[i].tempId
          try {
            const meta = await uploadDocument(file)
            if (meta.status === 'error') {
              setUploadingFiles((prev) =>
                prev.map((e) => (e.tempId === tempId ? { ...e, error: meta.error_message || 'Processing failed' } : e))
              )
            } else {
              setUploadingFiles((prev) => prev.filter((e) => e.tempId !== tempId))
            }
            await refreshDocuments()
          } catch (err) {
            setUploadingFiles((prev) =>
              prev.map((e) => (e.tempId === tempId ? { ...e, error: err.message || 'Upload failed' } : e))
            )
          }
        })
      )
    },
    [refreshDocuments]
  )

  const dismissUploadError = useCallback((tempId) => {
    setUploadingFiles((prev) => prev.filter((e) => e.tempId !== tempId))
  }, [])

  const removeDocument = useCallback(async (documentId) => {
    await deleteDocument(documentId)
    setDocuments((prev) => prev.filter((d) => d.id !== documentId))
    setSelectedDocumentIds((prev) => prev.filter((id) => id !== documentId))
  }, [])

  const toggleDocumentSelection = useCallback((documentId) => {
    setSelectedDocumentIds((prev) =>
      prev.includes(documentId) ? prev.filter((id) => id !== documentId) : [...prev, documentId]
    )
  }, [])

  const updateDocumentSummary = useCallback((documentId, summary) => {
    setDocuments((prev) => prev.map((d) => (d.id === documentId ? { ...d, summary } : d)))
  }, [])

  const readyDocuments = documents.filter((d) => d.status === 'ready')

  const value = {
    documents,
    readyDocuments,
    isLoading,
    loadError,
    uploadingFiles,
    selectedDocumentIds,
    addFiles,
    removeDocument,
    dismissUploadError,
    toggleDocumentSelection,
    updateDocumentSummary,
    refreshDocuments,
  }

  return <DocumentsContext.Provider value={value}>{children}</DocumentsContext.Provider>
}

export function useDocuments() {
  const ctx = useContext(DocumentsContext)
  if (!ctx) throw new Error('useDocuments must be used within a DocumentsProvider')
  return ctx
}
