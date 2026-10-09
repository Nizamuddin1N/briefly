import React from 'react'
import ReactDOM from 'react-dom/client'

// Self-hosted variable fonts — no request to Google Fonts at runtime.
import '@fontsource-variable/literata'
import '@fontsource-variable/schibsted-grotesk'

import './styles/tokens.css'
import './styles/global.css'
import './styles/prose.css'

import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
