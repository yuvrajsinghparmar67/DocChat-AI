import { useDocuments } from '../context/DocumentsContext'
import { useChat } from '../hooks/useChat'
import ChatHeader from '../components/chat/ChatHeader'
import MessageList from '../components/chat/MessageList'
import ChatComposer from '../components/chat/ChatComposer'

export default function ChatPage() {
  const { readyDocuments, selectedDocumentIds } = useDocuments()
  const { messages, isStreaming, sendMessage, stopStreaming, clearConversation } = useChat(selectedDocumentIds)

  const hasReadyDocuments = readyDocuments.length > 0

  return (
    <div className="flex h-full flex-1 flex-col">
      <ChatHeader
        readyCount={readyDocuments.length}
        selectedCount={selectedDocumentIds.length}
        messageCount={messages.length}
        onClear={clearConversation}
      />

      <MessageList
        messages={messages}
        hasReadyDocuments={hasReadyDocuments}
        onSuggestionClick={(text) => sendMessage(text)}
      />

      <ChatComposer
        disabled={!hasReadyDocuments}
        isStreaming={isStreaming}
        onSend={sendMessage}
        onStop={stopStreaming}
      />
    </div>
  )
}
