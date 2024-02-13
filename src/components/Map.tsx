import React, { useState, useRef, useEffect } from 'react'
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet'
import { Stakeholder } from 'types'
import StakeholderLayer from 'components/layers/StakeholderLayer'
import SearchControl from 'components/controls/SearchControl'
import InfoPanelControl from 'components/controls/InfoPanelControl'
import ZoomControl from 'components/controls/ZoomControl'
import TagControl from './controls/TagControl'
import LegendControl from './controls/LegendControl'
import { LatLngBoundsLiteral} from 'leaflet'

interface MapProps {
  apiKey: string
  stakeholders: Stakeholder[]
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
  const draggable = useRef(null);
  const handleTierGaterClick = (e: React.MouseEvent<HTMLDivElement>) => {
    console.log(draggable.current);
    e.stopPropagation();
    e.preventDefault();
  };

  
  return (
    <MapContainer className="w-full h-full" center={[20, 0]} zoom={3} minZoom={3} scrollWheelZoom={true} zoomControl={false} maxBounds={maxBounds}>
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

      <InfoPanelControl stakeholder={selectedStakeholder} onClick={handleTierGaterClick} onClose={() => setSelectedStakeholder(null)}/>

      <SearchControl layerRef={markersLayer} />
      <TagControl stakeholders={stakeholders} layerRef={markersLayer} />
      <ZoomControl zoomLevel={3} />
    </MapContainer>
  )
}

export default Map
