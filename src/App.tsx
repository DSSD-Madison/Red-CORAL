import React, { useState } from 'react'
import { useEffect } from 'react'
import Map from 'components/Map'
import 'leaflet/dist/leaflet.css'
import { initializeApp } from 'firebase/app'
import { Incident, Category, Type, DB } from 'types'
import { dummyData } from 'dummyData'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';


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

  // init firestore, storage

  const stadiaAPIKey = import.meta.env.VITE_STADIA_KEY
  const [isClicked, setIsClicked] = useState<boolean>(false);

  const [data, setData] = useState<DB>({
    Categories: {},
    Types: {},
    Incidents: {},
  })

  useEffect(() => {
    new Promise<DB>((resolve, reject) => {
      // Storage Query (user) or Firestore Query (admin)
      resolve(dummyData)
    })
      .then(setData)
      .catch((error) => {
        console.error(error)
      })
  }, [])
  const handleClick = () => {
    setIsClicked(true);
  };
  function Home() {
    return (
        <div className="relative h-full">
          <Map apiKey={stadiaAPIKey} data={data} />
        </div>
    );
  }
  function About() {
    return (
        <div style={{ padding: 20 }}>
          <h2>About View</h2>
          <p>Lorem ipsum dolor sit amet, consectetur adip.</p>
          <button onClick={handleClick}>Click me</button>
          {isClicked && <p>Button clicked!</p>}
        </div>
    );
  }
  return (
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </Router>
  )
}

export default App
