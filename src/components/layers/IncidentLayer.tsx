import L, { LatLngExpression, LatLngTuple } from 'leaflet'
import { forwardRef } from 'react'
import { useMap, Marker as LeafletMarker, LayerGroup, Polyline } from 'react-leaflet'
import { DB, Incident } from 'types'

interface IncidentLayerProps {
  data: DB
  selectedIncident: Incident | null
  setSelectedIncident: React.Dispatch<React.SetStateAction<Incident | null>>
  tmpIncident: Incident | null
  setTmpIncident: React.Dispatch<React.SetStateAction<Incident | null>>
  isLoggedIn: boolean
}

const IncidentLayer = forwardRef<any, IncidentLayerProps>(
  ({ data, selectedIncident, setSelectedIncident, tmpIncident, setTmpIncident, isLoggedIn }, ref) => {
    const map = useMap()

    map.addEventListener('dblclick', (e) => {
      if (!isLoggedIn) return
      let newTmpIncident: Incident
      if (tmpIncident) {
        newTmpIncident = { ...tmpIncident, location: [...tmpIncident.location, e.latlng] }
      } else {
        newTmpIncident = {
          name: '',
          description: '',
          timestamp: Date.now(),
          typeID: Object.keys(data.Types)[0],
          location: [e.latlng],
        }
      }
      setTmpIncident(newTmpIncident)
    })

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

    const incidentList = Object.values(data?.Incidents || {}).concat(tmpIncident ? [tmpIncident] : [])

    return (
      <LayerGroup ref={ref}>
        {incidentList.map((incident) =>
          incident.location.map((location, index) => (
            <LeafletMarker
              key={`incident-${index}-marker`}
              title={incident.name}
              position={location}
              icon={L.icon({
                iconUrl: selectedIncident === incident ? 'selected-marker.svg' : 'marker.svg',
                iconSize: selectedIncident === incident ? [40, 40] : [32, 32],
              })} //somehow need to set the color here to data.Categories[data.Types[incident.typeID].categoryID].color
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
        {incidentList.map((incident, i) => {
          if (incident.location.length > 1) {
            const positions = incident.location.map((coords) => [coords.lat, coords.lng] as LatLngExpression)
            const opts = incident == selectedIncident ? { color: 'red', opacity: 0.7 } : { color: 'black', opacity: 0.5 }
            return <Polyline key={`incident-${i}-path`} positions={positions} pathOptions={opts} />
          }
        })}
      </LayerGroup>
    )
  }
)

export default IncidentLayer
