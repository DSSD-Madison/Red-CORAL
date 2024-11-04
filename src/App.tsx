import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { initializeApp } from 'firebase/app'
import { getAuth, signOut } from 'firebase/auth'
import 'leaflet/dist/leaflet.css'
import Map from 'components/Map'
import Login from 'components/Login'
import CRUDDash from 'components/CRUDDash'
import StatsDashboard from 'components/StatsDashboard'
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

  /**
   * Adds an incident to firestore.
   * 🚨🚨🚨 Mutates the data state variable (does not trigger rerender).
   * Child that calls this function should trigger local rerender
   * This is so that the Map component isn't constantly getting rerendered,
   * causing the map to reset its view.
   */
  async function addIncident(incident: Incident): Promise<boolean> {
    try {
      const ref = await addDocWithTimestamp(collection(firestore, 'Incidents'), JSON.parse(JSON.stringify(incident)))
      data.Incidents[ref.id] = incident
      return true
    } catch (e) {
      console.error(e)
      return false
    }
  }

  /**
   * Modifies the firetore document for an incident
   * 🚨🚨🚨@see {@link addIncident} about how this affects state
   */
  async function editIncident(incidentID: keyof DB['Incidents'], incident: Incident): Promise<boolean> {
    try {
      await setDocWithTimestamp(doc(firestore, `Incidents/${incidentID}`), JSON.parse(JSON.stringify(incident)))
      data.Incidents[incidentID] = incident
      return true
    } catch (e) {
      console.error(e)
      return false
    }
  }

  /**
   * Deletes the firestore document for an incident
   * documents are not actually deleted for query efficiency reasons @see {@link deleteDocWithTimestamp}
   * 🚨🚨🚨@see {@link addIncident} about how this affects state
   */
  async function deleteIncident(incidentID: keyof DB['Incidents']): Promise<boolean> {
    try {
      await deleteDocWithTimestamp(doc(firestore, `Incidents/${incidentID}`))
      delete data.Incidents[incidentID]
      return true
    } catch (e) {
      console.error(e)
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

  const [loadCount, setLoadCount] = useState(0)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false) // State variable for sign-in status

  useEffect(() => {
    return auth.onAuthStateChanged((user) => setIsLoggedIn(!!user))
  }, [])

  async function fetchData(isAdmin: boolean) {
    setLoadCount((prev) => prev + 1)
    getData(isAdmin, storage, firestore)
      .then((db) => {
        setData(db)
      })
      .catch((e) => {
        console.error(e)
        alert('No se pudo cargar la información')
      })
      .finally(() => {
        setLoadCount((prev) => prev - 1)
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
          <Route path="/stats" element={<StatsDashboard />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin" element={<Navigate to="/login" />} />
          <Route path="/admin/dash" element={<AdminDash />} />
        </Routes>
      </Router>
      <LoadingOverlay isVisible={loadCount > 0} color={'#888888'} />
      <div className="absolute bottom-0 right-64 z-[800] rounded-sm bg-white/70 px-2 leading-none hover:bg-gray-300">
        {isLoggedIn ? (
          <button onClick={() => signOut(auth)} className="cursor-pointer text-sm">
            Salir
          </button>
        ) : (
          <button onClick={() => (window.location.href = '/login')} className="cursor-pointer text-xs">
            Registrarse
          </button>
        )}
      </div>
    </>
  )
}

export default App
