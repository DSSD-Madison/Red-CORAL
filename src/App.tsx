import React, { useState } from 'react'
import { useEffect } from 'react'
import Map from 'components/Map'
import 'leaflet/dist/leaflet.css'
import { getDatabase, ref } from 'firebase/database'
import { initializeApp } from 'firebase/app'
import { getData } from 'api'
import { Stakeholder } from 'types'

const App: React.FC = () => {
  const app = initializeApp({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  })
  const dbRef = ref(getDatabase(app))

  const stadiaAPIKey = import.meta.env.VITE_STADIA_KEY

  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([])

  useEffect(() => {
    getData(dbRef)
      .then(setStakeholders)
      .catch((error) => {
        console.error(error)
      })
  }, [dbRef])

  return (
    <div className="relative h-full">
          {/* <div className=" header-drop absolute left-0 right-0 top-0 z-[1000] flex justify-end p-5"> */}

      <div className=" header-drop absolute left-0 right-0 top-0 z-[1000] flex justify-end p-2 md:p-5">
        <img src="att-logo.png" alt="Harvard Logo" className="max-w-[40%] h-20 drop-shadow invert filter object-scale-down" />
      </div>

      <Map apiKey={stadiaAPIKey} stakeholders={stakeholders} />
    </div>
  )
}

export default App
