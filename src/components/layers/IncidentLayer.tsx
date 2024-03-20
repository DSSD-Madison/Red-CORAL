import L, { LatLngTuple } from 'leaflet'
import { forwardRef } from 'react'
import { useMap, Marker as LeafletMarker, LayerGroup } from 'react-leaflet'
import { Incident } from 'types'

interface IncidentLayerProps {
  incidents: { [key: string]: Incident }
  selectedIncident: Incident | null
  setSelectedIncident: React.Dispatch<React.SetStateAction<Incident | null>>
}

const IncidentLayer = forwardRef<any, IncidentLayerProps>(({ incidents, selectedIncident, setSelectedIncident }, ref) => {
  const map = useMap()

  const adjustView = (incident: Incident) => {
    // Incident location can be arbitrary number of coordinates
    const path = incident.location.map((coords) => [coords.lat, coords.lng] as LatLngTuple)
    // Leaflet expects rectangular bounds
    const bounds = L.latLngBounds([
      [Math.min(...path.map((coords) => coords[0])), Math.min(...path.map((coords) => coords[1]))],
      [Math.max(...path.map((coords) => coords[0])), Math.max(...path.map((coords) => coords[1]))],
    ])
    map.flyToBounds(bounds, { paddingTopLeft: [300, 0], duration: 3, easeLinearity: 0.5 })
  }
  const incidentsList = Object.values(incidents)

  return (
    <LayerGroup ref={ref}>
      {incidentsList.map((incident) =>
        incident.location.map((location, index) => (
          <LeafletMarker
            key={incident.name + (index > 0 ? index : '')}
            title={incident.name}
            position={location}
            icon={L.icon({
              iconUrl: selectedIncident === incident ? 'selected-marker.svg' : 'marker.svg',
              iconSize: selectedIncident === incident ? [40, 40] : [32, 32],
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
        ))
      )}
    </LayerGroup>
  )
})

export default IncidentLayer
