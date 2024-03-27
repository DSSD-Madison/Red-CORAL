import React, { useState } from 'react'
import { useEffect } from 'react'
import { FirebaseApp } from 'firebase/app'
import Map from 'components/Map'
import 'leaflet/dist/leaflet.css'
import { Incident, Category, Type, DB } from 'types'
import { getFirestore, collection, getDocs, addDoc } from 'firebase/firestore'
import { getStorage, ref, getBytes } from 'firebase/storage'
import LoadingOverlay from './LoadingOverlay'

interface HomeProps {
  app: FirebaseApp
  isAdmin: boolean
}

const Home: React.FC<HomeProps> = ({ app, isAdmin }) => {
  const firestore = getFirestore(app)
  const storage = getStorage(app, 'gs://red-coral-map.appspot.com')
  const stadiaAPIKey = import.meta.env.VITE_STADIA_KEY

  const [data, setData] = useState<DB>({
    Categories: {},
    Types: {},
    Incidents: {},
  })

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
      .catch((error) => {
        console.error(error)
      })
  }, [isAdmin])

  async function addIncident(incident: Incident): Promise<boolean> {
    try {
      const ref = await addDoc(collection(firestore, 'Incidents'), JSON.parse(JSON.stringify(incident)))
      data.Incidents[ref.id] = incident
      return true
    } catch (e) {
      console.error(e)
      return false
    }
  }
  return (
    <div className="relative h-full">
      {/* <div className="header-drop absolute left-0 right-0 top-0 z-[1000] flex justify-end p-2 md:p-5">
        <img src="banner.png" alt="Red CORAL logo" className="h-30 max-w-[40%] object-scale-down drop-shadow filter" />
      </div> */}
      <Map apiKey={stadiaAPIKey} data={data} isAdmin={isAdmin} addIncident={addIncident} />
      {isAdmin && <p className="absolute right-3 top-1 z-[1000] text-4xl text-red-dark">Admin</p>}
      <LoadingOverlay isVisible={Object.keys(data.Incidents).length === 0} />
    </div>
  )
}

export default Home
