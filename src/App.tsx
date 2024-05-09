import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { initializeApp } from 'firebase/app'
import { getAuth, signOut } from 'firebase/auth'
import 'leaflet/dist/leaflet.css'
import Map from 'components/Map'
import Login from 'components/Login'
import CRUDDash from 'components/CRUDDash'
import { getFirestore, collection, doc } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { addDocWithTimestamp, setDocWithTimestamp, deleteDocWithTimestamp, getData } from 'utils'
import { Incident, DB } from 'types'
import LoadingOverlay from './components/LoadingOverlay'

const App: React.FC = () => {
  const app = initializeApp({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  })

  const auth = getAuth(app)
  const firestore = getFirestore(app)
  const storage = getStorage(app, import.meta.env.VITE_FIREBASE_STORAGE_BUCKET)

  async function addIncident(incident: Incident): Promise<boolean> {
    // setIsLoading(true)
    try {
      const ref = await addDocWithTimestamp(collection(firestore, 'Incidents'), JSON.parse(JSON.stringify(incident)))
      data.Incidents[ref.id] = incident
      // setIsLoading(false)
      return true
    } catch (e) {
      console.error(e)
      // setIsLoading(false)
      return false
    }
  }

  async function editIncident(incidentID: keyof DB['Incidents'], incident: Incident): Promise<boolean> {
    // setIsLoading(true)
    try {
      await setDocWithTimestamp(doc(firestore, `Incidents/${incidentID}`), JSON.parse(JSON.stringify(incident)))
      data.Incidents[incidentID] = incident
      // setIsLoading(false)
      return true
    } catch (e) {
      console.error(e)
      // setIsLoading(false)
      return false
    }
  }

  async function deleteIncident(incidentID: keyof DB['Incidents']): Promise<boolean> {
    try {
      // setIsLoading(true)
      await deleteDocWithTimestamp(doc(firestore, `Incidents/${incidentID}`))
      delete data.Incidents[incidentID]
      // setIsLoading(false)
      return true
    } catch (e) {
      console.error(e)
      // setIsLoading(false)
      return false
    }
  }

  const [data, setData] = useState<DB>({
    Categories: {},
    Types: {},
    Incidents: {},
    filterBounds: {
      maxYear: 0,
      minYear: 0,
      locations: {},
    },
  })

  const [isLoading, setIsLoading] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false) // State variable for sign-in status

  useEffect(() => {
    return auth.onAuthStateChanged((user) => setIsLoggedIn(!!user))
  }, [])

  async function fetchData(isAdmin: boolean) {
    setIsLoading(true)
    getData(isAdmin, storage, firestore)
      .then((db) => {
        setData(db)
      })
      .catch((e) => {
        console.error(e)
        alert('No se pudo cargar la información')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  useEffect(() => {
    fetchData(isLoggedIn)
  }, [isLoggedIn])

  function LoginPage() {
    return (
      <>
        {!isLoggedIn && <Login auth={auth} />}
        {isLoggedIn && <Navigate to="/" />}
      </>
    )
  }

  function AdminDash() {
    return (
      <>
        {!isLoggedIn && <Login auth={auth} />}
        {isLoggedIn && <CRUDDash firestore={firestore} data={data} />}
      </>
    )
  }

  return (
    <>
      <Router>
        <Routes>
          <Route
            path="/"
            element={<Map data={data} isAdmin={isLoggedIn} addIncident={addIncident} editIncident={editIncident} deleteIncident={deleteIncident} />}
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin/dash" element={<AdminDash />} />
        </Routes>
      </Router>
      <LoadingOverlay isVisible={isLoading} color={'#888888'} />
      <div className="letf-0 absolute bottom-0 z-[1000] pb-5 pl-2">
        {isLoggedIn && (
          <button onClick={() => signOut(auth)} className=" cursor-pointer rounded-md bg-gray-200 p-1 hover:bg-gray-300">
            Salir del Sistema
          </button>
        )}
        {!isLoggedIn && (
          <button onClick={() => (window.location.href = '/login')} className="cursor-pointer rounded-md bg-gray-300 p-1 hover:bg-gray-400">
            Registrarse como Admin
          </button>
        )}
      </div>
    </>
  )
}

export default App
