import React, { useState } from 'react'
import { useEffect } from 'react'
import { FirebaseApp } from 'firebase/app'
import Map from 'components/Map'
import 'leaflet/dist/leaflet.css'
import { Incident, DB } from 'types'
import { getFirestore, collection, addDoc, setDoc, deleteDoc, doc } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import LoadingOverlay from './LoadingOverlay'
import { calculateBounds, getDBData } from 'utils'

interface HomeProps {
  app: FirebaseApp
  isAdmin: boolean
}

const Home: React.FC<HomeProps> = ({ app, isAdmin }) => {
  const firestore = getFirestore(app)
  const storage = getStorage(app, import.meta.env.VITE_FIREBASE_STORAGE_BUCKET)
  const stadiaAPIKey = import.meta.env.VITE_STADIA_KEY

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

  useEffect(() => {
    getDBData(isAdmin, firestore, storage)
      .then(calculateBounds)
      .then(setData)
      .then(() => setIsLoading(false))
      .catch((error) => {
        console.error(error)
      })
  }, [isAdmin])

  async function addIncident(incident: Incident): Promise<boolean> {
    setIsLoading(true)
    try {
      const ref = await addDoc(collection(firestore, 'Incidents'), JSON.parse(JSON.stringify(incident)))
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
      await setDoc(doc(firestore, `Incidents/${incidentID}`), JSON.parse(JSON.stringify(incident)))
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
      await deleteDoc(doc(firestore, `Incidents/${incidentID}`))
      delete data.Incidents[incidentID]
      setIsLoading(false)
      return true
    } catch (e) {
      console.error(e)
      setIsLoading(false)
      return false
    }
  }

  return (
    <div className="relative h-full">
      {/* <div className="header-drop absolute left-0 right-0 top-0 z-[1000] flex justify-end p-2 md:p-5">
        <img src="banner.png" alt="Red CORAL logo" className="h-30 max-w-[40%] object-scale-down drop-shadow filter" />
      </div> */}
      <Map
        apiKey={stadiaAPIKey}
        data={data}
        isAdmin={isAdmin}
        addIncident={addIncident}
        editIncident={editIncident}
        deleteIncident={deleteIncident}
      />
      {isAdmin && (
        <div className="absolute right-3 top-1 z-[1000]">
          <p className="text-4xl text-red-dark">Administrador</p>
          <button className="rounded-md bg-red-dark p-2 text-white" onClick={() => (window.location.href = '/admin/dash')}>
            Administrar categorías
          </button>
        </div>
      )}
      <LoadingOverlay isVisible={isLoading} />
    </div>
  )
}

export default Home
