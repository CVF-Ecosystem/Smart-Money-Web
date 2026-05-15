import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ToastProvider } from './sm-toast.jsx'
import App from './sm-app.jsx'
import './supabase-config.js'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter basename="/app">
    <ToastProvider>
      <App />
    </ToastProvider>
  </BrowserRouter>
)
