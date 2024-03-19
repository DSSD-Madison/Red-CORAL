import L, { LatLngTuple } from 'leaflet'
import { useState, useEffect, forwardRef } from 'react'
import { useMap, Popup, Marker as LeafletMarker, LayerGroup } from 'react-leaflet'
import { Incident } from 'types'

interface IncidentLayerProps {
  incidents: { [key: string]: Incident }
  selectedIncident: Incident | null
  setSelectedIncident: React.Dispatch<React.SetStateAction<Incident | null>>
}

const IncidentLayer = forwardRef<any, IncidentLayerProps>(({ incidents, selectedIncident, setSelectedIncident }, ref) => {
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

  const adjustView = (incident: Incident) => {
    // Incident location can be arbitrary number of coordinates
    const path = incident.location.map((coords) => [coords.lat, coords.lng] as LatLngTuple)
    // Leaflet expects rectangular bounds
    const bounds = L.latLngBounds([
      [Math.min(...path.map((coords) => coords[0])), Math.min(...path.map((coords) => coords[1]))],
      [Math.max(...path.map((coords) => coords[0])), Math.max(...path.map((coords) => coords[1]))],
    ])
    map.flyToBounds(bounds, { padding: [150, 150], duration: 3, easeLinearity: 0.5 })
    setIsViewAdjusted(false)
  }
  const incidentsList = Object.values(incidents)

  // TODO: Support one incident with multiple locations that all trigger the same popup.
  return (
    <LayerGroup ref={ref}>
      {incidentsList.map((incident) => (
        <LeafletMarker
          key={incident.name}
          title={incident.name}
          position={incident.location[0]}
          icon={L.icon({
            iconUrl: selectedIncident === incident ? 'selected-marker.svg' : 'marker.svg',
            iconSize: selectedIncident === incident ? [40, 40] : [32, 32], // Adjust the sizes as needed
          })}
          eventHandlers={{
            click: () => {
              if (selectedIncident === incident) {
                setSelectedIncident(null)
              } else {
                setSelectedIncident(incident)
                adjustView(incident)
              }
            },
          }}
        />
      ))}
    </LayerGroup>
  )
})

export default IncidentLayer
