import React from 'react'
import ReactDOM from 'react-dom/client'

import './index.css'
import FirebaseProvider from './context/firebase/provider'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <FirebaseProvider>
      <App />
    </FirebaseProvider>
  </React.StrictMode>
)
