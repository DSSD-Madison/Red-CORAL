import L, { LatLngExpression, LatLngTuple } from 'leaflet'
import { forwardRef } from 'react'
import { useMap, Marker as LeafletMarker, LayerGroup, Polyline } from 'react-leaflet'
import { DB, Incident } from 'types'

interface IncidentLayerProps {
  data: DB
  selectedIncidentID: keyof DB['Incidents'] | null
  setSelectedIncidentID: React.Dispatch<React.SetStateAction<keyof DB['Incidents'] | null>>
  isAdmin: boolean
  location: Incident['location']
  setLocation: React.Dispatch<React.SetStateAction<Incident['location']>>
  tmpSelected: boolean
  setTmpSelected: React.Dispatch<React.SetStateAction<boolean>>
}

const IncidentLayer = forwardRef<any, IncidentLayerProps>(
  ({ data, selectedIncidentID, setSelectedIncidentID, isAdmin, location, setLocation, tmpSelected, setTmpSelected }, ref) => {
    const map = useMap()

    map.addEventListener('dblclick', (e) => {
      if (!isAdmin) return
      setLocation([...location, e.latlng])
      setSelectedIncidentID(null)
      setTmpSelected(true)
    })

    const adjustView = (location: Incident['location']) => {
      // Incident location can be arbitrary number of coordinates
      const path = location.map((coords) => [coords.lat, coords.lng] as LatLngTuple)
      // Leaflet expects rectangular bounds
      const bounds = L.latLngBounds([
        [Math.min(...path.map((coords) => coords[0])), Math.min(...path.map((coords) => coords[1]))],
        [Math.max(...path.map((coords) => coords[0])), Math.max(...path.map((coords) => coords[1]))],
      ])
      map.flyToBounds(bounds, { paddingTopLeft: [300, 0], duration: 3, easeLinearity: 0.5 })
    }

    const incidentList = Object.entries(data?.Incidents || {})

    return (
      <LayerGroup ref={ref}>
        {incidentList.map(([id, incident], i) =>
          incident.location.map((loc, j) => (
            <LeafletMarker
              key={`incident-${i}-marker-${j}`}
              title={incident.name}
              position={loc}
              icon={L.icon({
                iconUrl: selectedIncidentID === id ? 'selected-marker.svg' : 'marker.svg',
                iconSize: selectedIncidentID === id ? [40, 40] : [32, 32],
              })} //somehow need to set the color here to data.Categories[data.Types[incident.typeID].categoryID].color
              eventHandlers={{
                click: () => {
                  if (selectedIncidentID === id) {
                    setSelectedIncidentID(null)
                  } else {
                    setSelectedIncidentID(id)
                    adjustView(incident.location)
                  }
                },
              }}
            />
          ))
        )}
        {location.map((loc, index) => (
          <LeafletMarker
            key={`tmp-incident-marker-${index}`}
            title={'tmp'}
            position={loc}
            icon={L.icon({
              iconUrl: tmpSelected ? 'selected-marker.svg' : 'marker.svg',
              iconSize: tmpSelected ? [40, 40] : [32, 32],
            })} //somehow need to set the color here to data.Categories[data.Types[incident.typeID].categoryID].color
            eventHandlers={{
              click: () => {
                if (tmpSelected) {
                  setTmpSelected(false)
                } else {
                  setTmpSelected(true)
                  adjustView(location)
                }
              },
            }}
          />
        ))}
        {incidentList.map(([id, incident], i) => {
          if (incident.location.length > 1) {
            const positions = incident.location.map((coords) => [coords.lat, coords.lng] as LatLngExpression)
            const opts = id == selectedIncidentID ? { color: 'red', opacity: 0.7 } : { color: 'black', opacity: 0.5 }
            return (
              <Polyline
                key={`incident-${i}-path`}
                positions={positions}
                pathOptions={opts}
                eventHandlers={{
                  click: () => {
                    if (selectedIncidentID === id) {
                      setSelectedIncidentID(null)
                    } else {
                      setSelectedIncidentID(id)
                      adjustView(incident.location)
                    }
                  },
                }}
              />
            )
          }
        })}
        {location.length > 1 && (
          <Polyline
            key={`tmp-incident-path`}
            positions={location.map((coords) => [coords.lat, coords.lng] as LatLngExpression)}
            pathOptions={tmpSelected ? { color: 'red', opacity: 0.7 } : { color: 'black', opacity: 0.5 }}
            eventHandlers={{
              click: () => {
                if (tmpSelected) {
                  setTmpSelected(false)
                } else {
                  setTmpSelected(true)
                  adjustView(location)
                }
              },
            }}
          />
        )}
      </LayerGroup>
    )
  }
)

export default IncidentLayer
