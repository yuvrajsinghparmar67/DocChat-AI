/**
 * Centralized API client for the FastAPI backend.
 *
 * In dev, Vite proxies `/api/*` to http://localhost:8000 (see vite.config.js),
 * so relative paths work unchanged in both dev and a same-origin production
 * deployment. Set VITE_API_BASE_URL to point at a different backend origin.
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function parseErrorResponse(response) {
  try {
    const data = await response.json()
    return data.detail || response.statusText
  } catch {
    return response.statusText || 'Something went wrong'
  }
}

/** Fetch the list of uploaded documents. */
export async function fetchDocuments() {
  const res = await fetch(`${BASE_URL}/api/documents`)
  if (!res.ok) throw new ApiError(await parseErrorResponse(res), res.status)
  const data = await res.json()
  return data.documents
}

/** Upload a single PDF file. Resolves to the created DocumentMetadata. */
export async function uploadDocument(file) {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch(`${BASE_URL}/api/documents/upload`, {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) throw new ApiError(await parseErrorResponse(res), res.status)
  return res.json()
}

/** Delete a document by id. */
export async function deleteDocument(documentId) {
  const res = await fetch(`${BASE_URL}/api/documents/${documentId}`, { method: 'DELETE' })
  if (!res.ok) throw new ApiError(await parseErrorResponse(res), res.status)
  return res.json()
}

/** Request (or fetch cached) AI summary for a document. */
export async function fetchSummary(documentId) {
  const res = await fetch(`${BASE_URL}/api/documents/${documentId}/summary`, { method: 'POST' })
  if (!res.ok) throw new ApiError(await parseErrorResponse(res), res.status)
  return res.json()
}

/**
 * Stream a chat answer over SSE.
 *
 * @param {object} params
 * @param {string} params.message
 * @param {string[]|null} params.documentIds
 * @param {{role: string, content: string}[]} params.history
 * @param {(sources: object[]) => void} params.onSources
 * @param {(tokenChunk: string) => void} params.onToken
 * @param {() => void} params.onDone
 * @param {(message: string) => void} params.onError
 * @param {AbortSignal} [params.signal]
 */
export async function streamChat({
  message,
  documentIds = null,
  history = [],
  onSources,
  onToken,
  onDone,
  onError,
  signal,
}) {
  let response
  try {
    response = await fetch(`${BASE_URL}/api/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, document_ids: documentIds, history }),
      signal,
    })
  } catch (err) {
    if (err.name === 'AbortError') return
    onError?.('Could not reach the server. Is the backend running?')
    return
  }

  if (!response.ok || !response.body) {
    onError?.(await parseErrorResponse(response))
    return
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      // SSE events are separated by a blank line.
      const events = buffer.split('\n\n')
      buffer = events.pop() ?? ''

      for (const rawEvent of events) {
        const line = rawEvent.trim()
        if (!line.startsWith('data:')) continue
        const jsonStr = line.slice(5).trim()
        if (!jsonStr) continue

        let payload
        try {
          payload = JSON.parse(jsonStr)
        } catch {
          continue
        }

        if (payload.type === 'sources') onSources?.(payload.sources)
        else if (payload.type === 'token') onToken?.(payload.content)
        else if (payload.type === 'done') onDone?.()
        else if (payload.type === 'error') onError?.(payload.message)
      }
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      onError?.('The connection was interrupted. Please try again.')
    }
  }
}

export { ApiError }
