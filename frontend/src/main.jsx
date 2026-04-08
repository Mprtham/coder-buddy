import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: '#1e1e2e',
          color: '#e8e8f5',
          border: '1px solid #2a2a40',
          borderRadius: '12px',
          fontSize: '13px',
        },
      }}
    />
  </React.StrictMode>
)
