import React, { useState } from 'react'
import { FirebaseApp } from 'firebase/app'
import Map from 'components/Map'
import 'leaflet/dist/leaflet.css'
import { Incident, DB } from 'types'

interface HomeProps {
  app: FirebaseApp
  isAdmin: boolean
  data: DB
  addIncident: (incident: Incident) => Promise<boolean>
  editIncident: (incidentID: keyof DB['Incidents'], incident: Incident) => Promise<boolean>
  deleteIncident: (incidentID: keyof DB['Incidents']) => Promise<boolean>
}

const Home: React.FC<HomeProps> = ({ app, isAdmin, data, addIncident, editIncident, deleteIncident }) => {
  const stadiaAPIKey = import.meta.env.VITE_STADIA_KEY
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
    </div>
  )
}

export default Home
