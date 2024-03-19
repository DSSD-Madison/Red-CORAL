import L, { LatLngTuple } from 'leaflet'
import { useState, useEffect, forwardRef } from 'react'
import { useMap, Popup, Marker as LeafletMarker, CircleMarker, LayerGroup } from 'react-leaflet'
import { Stakeholder } from 'types'

interface StakeholderLayerProps {
  stakeholders: Stakeholder[]
  selectedStakeholder: Stakeholder | null
  setSelectedStakeholder: React.Dispatch<React.SetStateAction<Stakeholder | null>>
  showLocationsServedMarkers: boolean
}

const StakeholderLayer = forwardRef<any, StakeholderLayerProps>(
  ({ stakeholders, selectedStakeholder, setSelectedStakeholder, showLocationsServedMarkers }, ref) => {
    const map = useMap()
    const [isViewAdjusted, setIsViewAdjusted] = useState(true)

    useEffect(() => {
      const handleZoomEnd = () => {
        setIsViewAdjusted(true)
      }

      map.on('zoomend', handleZoomEnd)

      return () => {
        map.off('zoomend', handleZoomEnd)
      }
    }, [map])

    const adjustView = (stakeholder: Stakeholder) => {
      if (stakeholder.global || !showLocationsServedMarkers) {
        map.flyTo([stakeholder.headquarterCoordinates.lat, stakeholder.headquarterCoordinates.lng], 5)
      } else {
        // If we want to show stakeholder's specific locations
        const bounds = [
          stakeholder.headquarterCoordinates,
          ...(stakeholder.locationsServedCoordinates ? stakeholder.locationsServedCoordinates : []),
        ].map((coord) => [coord.lat, coord.lng] as LatLngTuple)

        map.flyToBounds(bounds, { padding: [150, 150], duration: 1, easeLinearity: 0.5 })
      }
      setIsViewAdjusted(false)
    }

    return (
      <>
        <LayerGroup ref={ref}>
          {stakeholders.map((stakeholder) => (
            <LeafletMarker
              key={stakeholder.name}
              title={stakeholder.name}
              position={stakeholder.headquarterCoordinates}
              icon={L.icon({
                iconUrl: selectedStakeholder === stakeholder ? 'selected-marker.svg' : 'marker.svg',
                iconSize: selectedStakeholder === stakeholder ? [40, 40] : [32, 32], // Adjust the sizes as needed
              })}
              eventHandlers={{
                click: () => {
                  if (selectedStakeholder === stakeholder) {
                    setSelectedStakeholder(null)
                  } else {
                    setSelectedStakeholder(stakeholder)
                    adjustView(stakeholder)
                  }
                },
              }}
            />
          ))}
        </LayerGroup>
        <LayerGroup>
          {isViewAdjusted &&
            selectedStakeholder &&
            selectedStakeholder.locationsServed?.map((locationName, index) => {
              if (selectedStakeholder.locationsServedCoordinates && showLocationsServedMarkers) {
                return (
                  <CircleMarker
                    key={locationName}
                    center={selectedStakeholder.locationsServedCoordinates[index]}
                    radius={10}
                    color="harvard-chan-gray"
                    weight={1}
                    opacity={1}
                    fillOpacity={0.9}
                  >
                    <Popup>{locationName}</Popup>
                  </CircleMarker>
                )
              }
            })}
        </LayerGroup>
      </>
    )
  }
)

export default StakeholderLayer
