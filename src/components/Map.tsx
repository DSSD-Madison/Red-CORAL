import React, { useState, useRef, useEffect } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import { DB, Incident } from 'types'
import SearchControl from 'components/controls/SearchControl'
import InfoPanelControl from 'components/controls/InfoPanelControl'
import ZoomControl from 'components/controls/ZoomControl'
import TagControl from './controls/TagControl'
import LegendControl from './controls/LegendControl'
import IncidentLayer from './layers/IncidentLayer'
import { LatLngBoundsLiteral } from 'leaflet'

interface MapProps {
  apiKey: string
  data: DB
  isLoggedIn: boolean
}

function SetInitialBounds() {
  const map = useMap()
  useEffect(() => {
    map.setView([-27, -60], 3.5) // Centered on South America. If changing this, make sure to adjust the reset button in ZoomControl.tsx
  }, [])
  return null
}

const Map: React.FC<MapProps> = ({ apiKey, data, isLoggedIn }) => {
  const maxBounds: LatLngBoundsLiteral = [
    // Southwest coordinate
    [-90, -180],
    // Northeast coordinate
    [90, 180],
  ]
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const markersLayer = useRef(null)
  const [tmpIncident, setTmpIncident] = useState<Incident | null>(null)

  useEffect(() => {
    if (tmpIncident) {
      setSelectedIncident(tmpIncident)
    }
  }, [tmpIncident])

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
        selectedIncident={selectedIncident}
        setSelectedIncident={setSelectedIncident}
        ref={markersLayer}
        tmpIncident={tmpIncident}
        setTmpIncident={setTmpIncident}
        isLoggedIn={isLoggedIn}
      />
      <InfoPanelControl
        data={data}
        incident={selectedIncident}
        onClose={() => setSelectedIncident(null)}
        tmpIncident={tmpIncident}
        setTmpIncident={setTmpIncident}
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
