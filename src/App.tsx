import React, { useState } from 'react'
import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import Map from 'components/Map'
import 'leaflet/dist/leaflet.css'
import { Incident, Category, Type, DB } from 'types'
import Admin from 'components/Admin'
import { getFirestore, collection, getDocs } from 'firebase/firestore'
import { getStorage, ref, getBytes } from 'firebase/storage'

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
  const firestore = getFirestore(app)
  const storage = getStorage(app, 'gs://red-coral-map.appspot.com')

  // init firestore, storage

  const stadiaAPIKey = import.meta.env.VITE_STADIA_KEY
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false) // State variable for sign-in status

  const handleSignInSuccess = () => {
    setIsLoggedIn(true) // Update the sign-in status to true
  }
  const [data, setData] = useState<DB>({
    Categories: {},
    Types: {},
    Incidents: {},
  })

  useEffect(() => {
    new Promise<DB>(async (resolve, reject) => {
      try {
        if (isLoggedIn) {
          const db: DB = {
            Categories: {},
            Types: {},
            Incidents: {},
          }
          // prettier-ignore
          const [catSnap, typeSnap, incSnap] = await Promise.all([
            getDocs(collection(firestore, 'Categories')),
            getDocs(collection(firestore, 'Types')),
            getDocs(collection(firestore, 'Incidents')),
        ])
          catSnap.forEach((doc) => {
            const cat = doc.data() as Category
            db.Categories[doc.id] = cat
          })
          typeSnap.forEach((doc) => {
            const type = doc.data() as Type
            db.Types[doc.id] = type
          })
          incSnap.forEach((doc) => {
            const inc = doc.data() as Incident
            db.Incidents[doc.id] = inc
          })
          resolve(db)
        } else {
          const bytes = await getBytes(ref(storage, 'state.json'))
          const db: DB = JSON.parse(new TextDecoder().decode(bytes))
          resolve(db)
        }
      } catch (error) {
        reject(error)
      }
    })
      .then(setData)
      .catch((error) => {
        console.error(error)
      })
  }, [isLoggedIn])

  function Home() {
    return (
      <div className="relative h-full">
        {/* <div className=" header-drop absolute left-0 right-0 top-0 z-[1000] flex justify-end p-2 md:p-5">
          <img src="banner.png" alt="Red CORAL logo" className="h-30 max-w-[40%] object-scale-down drop-shadow filter" />
        </div> */}
        <Map apiKey={stadiaAPIKey} data={data} isLoggedIn={isLoggedIn} />
        {isLoggedIn && <p className="absolute right-3 top-1 z-[1000] text-4xl text-red-dark">Admin</p>}
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<Admin auth={auth} onSignInSuccess={handleSignInSuccess} />} />
      </Routes>
    </Router>
  )
}

export default App
