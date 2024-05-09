import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import 'leaflet/dist/leaflet.css'
import Map from 'components/Map'
import Login from 'components/Login'
import CRUDDash from 'components/CRUDDash'
import { getFirestore, collection, doc, getDocs, query, where, Timestamp } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { calculateBounds, mergeDBs, addDocWithTimestamp, setDocWithTimestamp, deleteDocWithTimestamp } from 'utils'
import { Incident, Category, Type, DB } from 'types'
import { ref, getBytes } from 'firebase/storage'
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
    setIsLoading(true)
    try {
      const ref = await addDocWithTimestamp(collection(firestore, 'Incidents'), JSON.parse(JSON.stringify(incident)))
      data.Incidents[ref.id] = incident
      setIsLoading(false)
      return true
    } catch (e) {
      console.error(e)
      setIsLoading(false)
      return false
    }
  }

  async function editIncident(incidentID: keyof DB['Incidents'], incident: Incident): Promise<boolean> {
    setIsLoading(true)
    try {
      await setDocWithTimestamp(doc(firestore, `Incidents/${incidentID}`), JSON.parse(JSON.stringify(incident)))
      data.Incidents[incidentID] = incident
      setIsLoading(false)
      return true
    } catch (e) {
      console.error(e)
      setIsLoading(false)
      return false
    }
  }

  async function deleteIncident(incidentID: keyof DB['Incidents']): Promise<boolean> {
    try {
      setIsLoading(true)
      await deleteDocWithTimestamp(doc(firestore, `Incidents/${incidentID}`))
      delete data.Incidents[incidentID]
      setIsLoading(false)
      return true
    } catch (e) {
      console.error(e)
      setIsLoading(false)
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

  const [isLoading, setIsLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false) // State variable for sign-in status
  const [gotStorageData, setGotStorageData] = useState<boolean>(false)
  const [readAt, setReadAt] = useState<Timestamp>(new Timestamp(0, 0))

  useEffect(() => {
    auth.authStateReady().then(() => {
      setIsLoggedIn(auth.currentUser != null)
    })

    // fetch data from firebase storage on mount of app
    if (gotStorageData) return
    setIsLoading(true)
    console.log('querying storage')
    getBytes(ref(storage, 'state.json'))
      .then((bytes) => {
        const db: DB = JSON.parse(new TextDecoder().decode(bytes))
        if (db.readAt) {
          let date = new Date(db.readAt)
          setReadAt(Timestamp.fromDate(date))
        }
        for (let col of ['Categories', 'Types', 'Incidents']) {
          //@ts-ignore
          for (let key in db[col]) {
            //@ts-ignore
            if (db[col][key].deletedAt != undefined) {
              //@ts-ignore
              delete db[col][key]
            }
          }
        }
        const dbWithBounds = calculateBounds(db)
        setData(dbWithBounds)
        setGotStorageData(true)
        setIsLoading(false)
      })
      .catch((e) => {
        console.error(e)
        alert('No se pudo cargar la base de datos')
        setIsLoading(false)
      })
  }, [])
  useEffect(() => {
    if (!isLoggedIn || !gotStorageData) return
    setIsLoading(true)
    const db: DB = {
      Categories: {},
      Types: {},
      Incidents: {},
      filterBounds: {
        maxYear: 0,
        minYear: 0,
        locations: {},
      },
    }
    console.log('querying firestore')
    //prettier-ignore
    const q = where('updatedAt', '>', readAt)
    // Need to have indices in Firestore for the above query to work

    // console.log(readAt?.toDate())

    Promise.all([
      getDocs(query(collection(firestore, 'Categories'), q)),
      getDocs(query(collection(firestore, 'Types'), q)),
      getDocs(query(collection(firestore, 'Incidents'), q)),
    ])
      .then(([catSnap, typeSnap, incSnap]) => {
        catSnap.forEach((doc) => {
          const cat = doc.data() as Category
          if (cat.deleted) {
            delete data.Categories[doc.id]
          } else db.Categories[doc.id] = cat
        })
        typeSnap.forEach((doc) => {
          const type = doc.data() as Type
          if (type.deleted) {
            delete data.Types[doc.id]
          } else db.Types[doc.id] = type
        })
        incSnap.forEach((doc) => {
          const inc = doc.data() as Incident
          // console.log(inc)
          if (inc.deleted) {
            delete data.Incidents[doc.id]
          } else db.Incidents[doc.id] = inc
        })
        setData(calculateBounds(mergeDBs(data, db)))
        setIsLoading(false)
      })
      .catch((e) => {
        console.error(e)
        alert('No se pudo obtener la versión más reciente de los datos.')
        setIsLoading(false)
      })
  }, [isLoggedIn, gotStorageData])

  const handleSignInSuccess = () => {
    setIsLoggedIn(true) // Update the sign-in status to true
  }

  function Admin() {
    return (
      <>
        {!isLoggedIn && <Login auth={auth} onSignInSuccess={handleSignInSuccess} />}
        {isLoggedIn && <Map data={data} isAdmin={true} addIncident={addIncident} editIncident={editIncident} deleteIncident={deleteIncident} />}
      </>
    )
  }

  function AdminDash() {
    return (
      <>
        {!isLoggedIn && <Login auth={auth} onSignInSuccess={handleSignInSuccess} />}
        {isLoggedIn && <CRUDDash firestore={firestore} data={data} setData={setData} />}
      </>
    )
  }

  return (
    <>
      <Router>
        <Routes>
          <Route
            path="/"
            element={<Map data={data} isAdmin={false} addIncident={addIncident} editIncident={editIncident} deleteIncident={deleteIncident} />}
          />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/dash" element={<AdminDash />} />
        </Routes>
      </Router>
      <LoadingOverlay isVisible={isLoading} color={'#888888'} />
    </>
  )
}

export default App
