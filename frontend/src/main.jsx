import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { DocumentsProvider } from './context/DocumentsContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <DocumentsProvider>
          <App />
        </DocumentsProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
)
