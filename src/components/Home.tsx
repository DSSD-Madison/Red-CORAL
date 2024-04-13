import React, { useState } from 'react'
import { useEffect } from 'react'
import { FirebaseApp } from 'firebase/app'
import Map from 'components/Map'
import 'leaflet/dist/leaflet.css'
import { Incident, Category, Type, DB } from 'types'
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore'
import { getStorage, ref, getBytes } from 'firebase/storage'
import LoadingOverlay from './LoadingOverlay'

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
  })

  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    new Promise<DB>(async (resolve, reject) => {
      try {
        if (isAdmin) {
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
      <Map apiKey={stadiaAPIKey} data={data} isAdmin={isAdmin} addIncident={addIncident} deleteIncident={deleteIncident} />
      {isAdmin && <p className="absolute right-3 top-1 z-[1000] text-4xl text-red-dark">Admin</p>}
      <LoadingOverlay isVisible={isLoading} />
    </div>
  )
}

export default Home
