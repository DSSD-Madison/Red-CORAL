import React, { useState, useRef, useEffect } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import { DB, Incident } from 'types'
// import SearchControl from 'components/controls/SearchControl'
import InfoPanelControl from 'components/controls/InfoPanelControl'
import ZoomControl from 'components/controls/ZoomControl'
// import TagControl from './controls/TagControl'
// import LegendControl from './controls/LegendControl'
import IncidentLayer from './layers/IncidentLayer'
import { LatLngBoundsLiteral } from 'leaflet'

interface MapProps {
  apiKey: string
  data: DB
  isAdmin: boolean
  addIncident: (incident: Incident) => Promise<boolean>
  deleteIncident: (incidentID: keyof DB['Incidents']) => Promise<boolean>
}

function SetInitialBounds() {
  const map = useMap()
  useEffect(() => {
    map.setView([-27, -60], 3.5) // Centered on South America. If changing this, make sure to adjust the reset button in ZoomControl.tsx
  }, [])
  return null
}

const Map: React.FC<MapProps> = ({ apiKey, data, isAdmin, addIncident, deleteIncident }) => {
  const maxBounds: LatLngBoundsLiteral = [
    // Southwest coordinate
    [-90, -180],
    // Northeast coordinate
    [90, 180],
  ]
  const [selectedIncidentID, setSelectedIncidentID] = useState<keyof DB['Incidents'] | null>(null)
  const [tmpSelected, setTmpSelected] = useState<boolean>(false)
  const markersLayer = useRef(null)
  const [name, setName] = useState<Incident['name']>('')
  const [description, setDescription] = useState<Incident['description']>('')
  const [dateString, setDateString] = useState<Incident['dateString']>('')
  const [typeID, setTypeID] = useState<keyof DB['Types']>('')
  const [catID, setCatID] = useState<keyof DB['Categories']>('')
  const [location, setLocation] = useState<Incident['location']>([])

  async function submitIncident(): Promise<boolean> {
    if (!name) {
      alert('Please enter a name for the incident')
      return false
    }
    if (!dateString) {
      alert('Please enter a date for the incident')
      return false
    }
    if (location.length == 0) {
      alert('There is no location for the incident, please double click on the map to add a location')
      return false
    }

    if (!Object.keys(data.Types).some((id) => id == typeID)) {
      alert('Tipo de evento no válido, algo salió mal')
      return false
    }

    if (!(await addIncident({ name, description, dateString, typeID, location }))) {
      alert('No se pudo crear el incidente')
      return false
    }
    setName('')
    setDescription('')
    setDateString('')
    setTypeID('')
    setCatID('')
    setLocation([])
    alert('Incidente creado con éxito')
    return true
  }

  async function deleteSelectedIncident() {
    if (!selectedIncidentID) {
      return
    }
    if (await deleteIncident(selectedIncidentID)) {
      setSelectedIncidentID(null)
      alert('Incidente eliminado con éxito')
    } else {
      alert('No se pudo eliminar el incidente')
    }
  }

  function onClose() {
    setSelectedIncidentID(null)
    setTmpSelected(false)
  }

  return (
    <MapContainer
      className="h-full w-full"
      center={[20, 0]}
      zoom={2}
      minZoom={2}
      maxZoom={12} // We can adjust this later depending on how detailed the data is.
      scrollWheelZoom={true}
      zoomControl={false}
      maxBounds={maxBounds}
      doubleClickZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url={`https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}{r}.png?api_key=${apiKey}`}
      />
      <IncidentLayer
        data={data}
        selectedIncidentID={selectedIncidentID}
        setSelectedIncidentID={setSelectedIncidentID}
        ref={markersLayer}
        isAdmin={isAdmin}
        tmpLocation={location}
        setTmpLocation={setLocation}
        tmpSelected={tmpSelected}
        setTmpSelected={setTmpSelected}
      />
      <InfoPanelControl
        data={data}
        incidentID={selectedIncidentID}
        onClose={onClose}
        submitIncident={submitIncident}
        name={name}
        setName={setName}
        description={description}
        setDescription={setDescription}
        dateString={dateString}
        setDateString={setDateString}
        typeID={typeID}
        setTypeID={setTypeID}
        catID={catID}
        setCatID={setCatID}
        location={location}
        setLocation={setLocation}
        tmpSelected={tmpSelected}
        setTmpSelected={setTmpSelected}
        isAdmin={isAdmin}
        deleteSelectedIncident={deleteSelectedIncident}
      />
      {/* <LegendControl selectedStakeholder={selectedStakeholder} /> 
       <SearchControl layerRef={markersLayer} />
      <TagControl stakeholders={stakeholders} layerRef={markersLayer} /> */}
      <ZoomControl zoomLevel={2} />
      <SetInitialBounds />
    </MapContainer>
  )
}

export default Map
