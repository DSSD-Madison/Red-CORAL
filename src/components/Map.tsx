import React, { useState, useRef } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import { Stakeholder } from 'types'
import StakeholderLayer from 'components/layers/StakeholderLayer'
import SearchControl from 'components/controls/SearchControl'
import InfoPanelControl from 'components/controls/InfoPanelControl'
import ZoomControl from 'components/controls/ZoomControl'
import TagControl from './controls/TagControl'
import LegendControl from './controls/LegendControl'
import { LatLngBoundsLiteral } from 'leaflet'

interface MapProps {
  apiKey: string
  stakeholders: Stakeholder[]
}

function SetInitialBounds() {
  const map = useMap()
  map.setView([-27, -60], 3.5)
  return null
}

const Map: React.FC<MapProps> = ({ apiKey, stakeholders }) => {
  const maxBounds: LatLngBoundsLiteral = [
    // Southwest coordinate
    [-90, -180],
    // Northeast coordinate
    [90, 180],
  ]
  const [selectedStakeholder, setSelectedStakeholder] = useState<Stakeholder | null>(null)
  const markersLayer = useRef(null)

  return (
    <MapContainer className="h-full w-full" center={[20, 0]} zoom={2} minZoom={2} scrollWheelZoom={true} zoomControl={false} maxBounds={maxBounds}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url={`https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png?api_key=${apiKey}`}
      />
      <StakeholderLayer
        stakeholders={stakeholders}
        selectedStakeholder={selectedStakeholder}
        setSelectedStakeholder={setSelectedStakeholder}
        ref={markersLayer}
        showLocationsServedMarkers={false}
      />
      <LegendControl selectedStakeholder={selectedStakeholder} />
      <InfoPanelControl stakeholder={selectedStakeholder} onClose={() => setSelectedStakeholder(null)} />

      <SearchControl layerRef={markersLayer} />
      <TagControl stakeholders={stakeholders} layerRef={markersLayer} />
      <ZoomControl zoomLevel={2} />
      <SetInitialBounds />
    </MapContainer>
  )
}

export default Map
