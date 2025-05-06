import React, { createContext, useContext, useEffect, useState } from 'react'
import { initializeApp } from 'firebase/app'
import { getAuth, Auth } from 'firebase/auth'
import { getFirestore, Firestore, collection, doc } from 'firebase/firestore'
import { getStorage, FirebaseStorage } from 'firebase/storage'
import { addDocWithTimestamp, setDocWithTimestamp, deleteDocWithTimestamp, fetchData, calculateBounds } from 'utils'
import { clearIndexedDBCache, getFromIndexedDB, saveToIndexedDB } from 'utils/indexedDB'
import { Incident, DB } from 'types'

const CACHE_LIFETIME = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
interface DBContextType {
  db: DB
  addIncident: (incident: Incident) => Promise<boolean>
  editIncident: (incidentID: keyof DB['Incidents'], incident: Incident) => Promise<boolean>
  deleteIncident: (incidentID: keyof DB['Incidents']) => Promise<boolean>
  auth: Auth
  firestore: Firestore
  storage: FirebaseStorage
  fetchData: (isAdmin: boolean) => Promise<void>
  clearCache: () => Promise<void>
  isLoggedIn: boolean
  isLoading: boolean
}

const DBContext = createContext<DBContextType | undefined>(undefined)

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

// exporting DB outside of React to be used in other files
// fixed the issue of DB being undefined in the marker cluster icon functions
export let db: DB

export const DBProvider: React.FC<{ children: React.ReactNode }> = (props) => {
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

  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(auth.currentUser !== null)

  useEffect(() => {
    return auth.onAuthStateChanged((user) => {
      setIsLoggedIn(!!user)
      loadDB(!!user)
    })
  }, [])

  /**
   * Adds an incident to firestore.
   * 🚨🚨🚨 Mutates the data state variable (does not trigger rerender).
   * Child that calls this function should trigger local rerender
   * This is so that the Map component isn't constantly getting rerendered,
   * causing the map to reset its view.
   */
  async function addIncident(incident: Incident): Promise<boolean> {
    try {
      setIsLoading(() => true)
      const ref = await addDocWithTimestamp(collection(firestore, 'Incidents'), JSON.parse(JSON.stringify(incident)))
      setData((data) => ({
        ...data,
        Incidents: {
          ...data.Incidents,
          [ref.id]: incident,
        },
        filterBounds: calculateBounds(data.Incidents),
      }))
      return true
    } catch (e) {
      console.error(e)
      return false
    } finally {
      setIsLoading(() => false)
    }
  }

  /**
   * Modifies the firetore document for an incident
   * 🚨🚨🚨@see {@link addIncident} about how this affects state
   */
  async function editIncident(incidentID: keyof DB['Incidents'], incident: Incident): Promise<boolean> {
    try {
      setIsLoading(() => true)
      await setDocWithTimestamp(doc(firestore, `Incidents/${incidentID}`), JSON.parse(JSON.stringify(incident)))
      setData((data) => ({
        ...data,
        Incidents: {
          ...data.Incidents,
          [incidentID]: incident,
        },
      }))
      return true
    } catch (e) {
      console.error(e)
      return false
    } finally {
      setIsLoading(() => false)
    }
  }

  /**
   * Deletes the firestore document for an incident
   * documents are not actually deleted for query efficiency reasons @see {@link deleteDocWithTimestamp}
   * 🚨🚨🚨@see {@link addIncident} about how this affects state
   */
  async function deleteIncident(incidentID: keyof DB['Incidents']): Promise<boolean> {
    try {
      setIsLoading(() => true)
      await deleteDocWithTimestamp(doc(firestore, `Incidents/${incidentID}`))
      setData((data) => {
        const newData = { ...data }
        delete newData.Incidents[incidentID]
        return newData
      })
      return true
    } catch (e) {
      console.error(e)
      return false
    } finally {
      setIsLoading(() => false)
    }
  }

  /**
   * Clears the IndexedDB cache and forces a fresh fetch from Firebase
   */
  async function clearCache(): Promise<void> {
    try {
      setIsLoading(() => true)
      await clearIndexedDBCache()
      await loadDB(isLoggedIn)
    } catch (e) {
      console.error('Failed to clear cache:', e)
    } finally {
      setIsLoading(() => false)
    }
  }

  async function loadDB(isAdmin: boolean) {
    setIsLoading(() => true)
    // read from cache if not admin
    if (!isAdmin) {
      const cachedData = await getFromIndexedDB()
      if (cachedData && cachedData.cachedAt) {
        setData(cachedData)
        db = cachedData
        setIsLoading(() => false)
        if (new Date().getTime() - new Date(cachedData.cachedAt).getTime() < CACHE_LIFETIME) {
          return
        }
      }
    }
    // If cache miss or admin mode, fetch from Firebase
    fetchData(isAdmin, storage, firestore)
      .then((freshData) => {
        setData(freshData)
        db = freshData
      })
      .catch((e) => {
        console.error(e)
        alert('No se pudo cargar la información')
      })
      .finally(() => {
        setIsLoading(() => false)
      })
  }

  useEffect(() => {
    db = data
    // When data changes and user is not an admin, update the IndexedDB cache (shouldn't actually happen?)
    if (!isLoggedIn && Object.keys(data.Incidents).length > 0) {
      saveToIndexedDB(data).catch((e) => console.warn('Failed to update cache:', e))
    }
  }, [data, isLoggedIn])

  const value: DBContextType = {
    db: data,
    addIncident,
    editIncident,
    deleteIncident,
    auth,
    firestore,
    storage,
    fetchData: loadDB,
    clearCache,
    isLoading,
    isLoggedIn,
  }

  return <DBContext.Provider value={value}>{props.children}</DBContext.Provider>
}

export const useDB = (): DBContextType => {
  const context = useContext(DBContext)
  if (!context) {
    throw new Error('useDB must be used within a DBProvider')
  }
  return context
}
