import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import 'leaflet/dist/leaflet.css'
import Login from 'components/Login'
import Home from 'components/Home'
import CRUDDash from 'components/CRUDDash'

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

  useEffect(() => {
    auth.authStateReady().then(() => {
      setIsLoggedIn(auth.currentUser != null)
    })
  }, [])

  // init firestore, storage
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false) // State variable for sign-in status

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

  function AdminDash() {
    return (
      <>
        {!isLoggedIn && <Login auth={auth} onSignInSuccess={handleSignInSuccess} />}
        {isLoggedIn && <CRUDDash app={app} />}
      </>
    )
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home app={app} isAdmin={false} />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/dash" element={<AdminDash />} />
      </Routes>
    </Router>
  )
}

export default App
