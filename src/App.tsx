import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import 'leaflet/dist/leaflet.css'
import Login from 'components/Login'
import Home from 'components/Home'

const App: React.FC = () => {
  const app = initializeApp({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  })

  const auth = getAuth(app)

  // init firestore, storage
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(auth.currentUser != null) // State variable for sign-in status

  const handleSignInSuccess = () => {
    setIsLoggedIn(true) // Update the sign-in status to true
  }

  function Admin() {
    return (
      <>
        {!isLoggedIn && <Login auth={auth} onSignInSuccess={handleSignInSuccess} />}
        {isLoggedIn && <Home app={app} isAdmin={true} />}
      </>
    )
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home app={app} isAdmin={false} />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Router>
  )
}

export default App
