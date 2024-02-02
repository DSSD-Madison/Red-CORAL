import React, { useState, useRef } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import { Stakeholder } from 'types'
import StakeholderLayer from 'components/layers/StakeholderLayer'
import SearchControl from 'components/controls/SearchControl'
import InfoPanelControl from 'components/controls/InfoPanelControl'
import ZoomControl from 'components/controls/ZoomControl'

interface MapProps {
  apiKey: string
  stakeholders: Stakeholder[]
}

const Map: React.FC<MapProps> = ({ apiKey, stakeholders }) => {
  const [selectedStakeholder, setSelectedStakeholder] = useState<Stakeholder | null>(null)
  const markersLayer = useRef(null)

  return (
    <MapContainer className="w-full h-full" center={[20, 0]} zoom={3} scrollWheelZoom={true} zoomControl={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url={`https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png?api_key=${apiKey}`}
      />
      <StakeholderLayer stakeholders={stakeholders} selectedStakeholder={selectedStakeholder} setSelectedStakeholder={setSelectedStakeholder} ref={markersLayer} />

      <InfoPanelControl stakeholder={selectedStakeholder} onClose={() => setSelectedStakeholder(null)} />
      <ZoomControl zoomLevel={3} />
      <SearchControl layerRef={markersLayer} />
    </MapContainer>
  )
}

export default Map
