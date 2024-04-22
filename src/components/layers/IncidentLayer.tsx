import L, { LatLngTuple } from 'leaflet'
import { forwardRef } from 'react'
import { useMap, Marker as LeafletMarker, LayerGroup } from 'react-leaflet'
import { DB, Incident, MarkerFilters } from 'types'

interface IncidentLayerProps {
  data: DB
  selectedIncidentID: keyof DB['Incidents'] | null
  setSelectedIncidentID: React.Dispatch<React.SetStateAction<keyof DB['Incidents'] | null>>
  isAdmin: boolean
  tmpLocation: Incident['location'] | null
  setTmpLocation: React.Dispatch<React.SetStateAction<Incident['location'] | null>>
  tmpSelected: boolean
  setTmpSelected: React.Dispatch<React.SetStateAction<boolean>>
  filters: MarkerFilters
}

const IncidentLayer = forwardRef<any, IncidentLayerProps>(
  ({ data, selectedIncidentID, setSelectedIncidentID, isAdmin, tmpLocation, setTmpLocation, tmpSelected, setTmpSelected, filters }, ref) => {
    const map = useMap()

    map.addEventListener('dblclick', (e) => {
      if (!isAdmin) return
      setTmpLocation(e.latlng)
      setSelectedIncidentID(null)
      setTmpSelected(true)
    })

    const adjustView = (location: Incident['location'] | null) => {
      if (!location) return
      // Incident location can be arbitrary number of coordinate
      const path = [location].map((coords) => [coords.lat, coords.lng] as LatLngTuple)
      // Leaflet expects rectangular bounds
      const bounds = L.latLngBounds([
        [Math.min(...path.map((coords) => coords[0])), Math.min(...path.map((coords) => coords[1]))],
        [Math.max(...path.map((coords) => coords[0])), Math.max(...path.map((coords) => coords[1]))],
      ])
      map.flyToBounds(bounds, { paddingTopLeft: [300, 0], duration: 3, easeLinearity: 0.5 })
    }

    // Applying MarkerFilters to the incidents.
    const incidentList = Object.entries(data?.Incidents || {}).filter(
      ([_, incident]) =>
        (!filters.startYear || new Date(incident.dateString).getFullYear() >= filters.startYear) &&
        (!filters.endYear || new Date(incident.dateString).getFullYear() <= filters.endYear) &&
        !filters.hideCountries.includes(incident.country) &&
        !filters.hideDepartments.includes(incident.department) &&
        !filters.hideCategories.includes(data.Types[incident.typeID].categoryID) &&
        !filters.hideTypes.includes(incident.typeID)
    )

    const typeColors = Object.fromEntries(Object.entries(data?.Types || {}).map(([id, type]) => [id, data.Categories[type.categoryID].color]))

    return (
      <LayerGroup ref={ref}>
        <svg style={{ display: 'none' }} xmlns="http://www.w3.org/2000/svg" viewBox="-1 -1 18 18">
          <symbol id="marker">
            <path
              d="M8,0C4.688,0,2,2.688,2,6c0,6,6,10,6,10s6-4,6-10C14,2.688,11.312,0,8,0z M8,8C6.344,8,5,6.656,5,5s1.344-3,3-3s3,1.344,3,3 S9.656,8,8,8z"
              stroke="#D6D6D7"
              strokeWidth="1"
              fill="none"
            />
            <path
              d="M8,0C4.688,0,2,2.688,2,6c0,6,6,10,6,10s6-4,6-10C14,2.688,11.312,0,8,0z M8,8C6.344,8,5,6.656,5,5s1.344-3,3-3s3,1.344,3,3 S9.656,8,8,8z"
              fill="currentColor"
            />
          </symbol>
        </svg>
        {incidentList.map(([id, incident], i) => (
          <LeafletMarker
            key={`incident-${i}-marker`}
            title={incident.name}
            position={incident.location}
            icon={L.divIcon({
              iconSize: id == selectedIncidentID ? [40, 40] : [32, 32],
              className: '',
              html: `<svg viewBox="-1 -1 18 18" ${id == selectedIncidentID ? 'width="40px" height="40px"' : 'width="32px" height="32px"'} style="color: ${id == selectedIncidentID ? 'red' : typeColors[incident.typeID]};">
                        <use href="#marker" />
                      </svg>`,
            })}
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
        ))}
        {tmpLocation && (
          <LeafletMarker
            title={''}
            position={tmpLocation}
            icon={L.divIcon({
              iconSize: tmpSelected ? [40, 40] : [32, 32],
              className: '',
              html: `<svg viewBox="-1 -1 18 18" ${tmpSelected ? 'width="40px" height="40px"' : 'width="32px" height="32px"'} style="color: ${tmpSelected ? 'red' : 'black'};">
                      <use href="#marker" />
                    </svg>`,
            })}
            eventHandlers={{
              click: () => {
                if (tmpSelected) {
                  setTmpSelected(false)
                } else {
                  setTmpSelected(true)
                  adjustView(tmpLocation)
                }
              },
            }}
          />
        )}
        {/* {incidentList.map(([id, incident], i) => {
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
        })} */}
        {/* {tmpLocation.length > 1 && (
          <Polyline
            key={`tmp-incident-path`}
            positions={tmpLocation.map((coords) => [coords.lat, coords.lng] as LatLngExpression)}
            pathOptions={tmpSelected ? { color: 'red', opacity: 0.7 } : { color: 'black', opacity: 0.5 }}
            eventHandlers={{
              click: () => {
                if (tmpSelected) {
                  setTmpSelected(false)
                } else {
                  setTmpSelected(true)
                  adjustView(tmpLocation)
                }
              },
            }}
          />
        )} */}
      </LayerGroup>
    )
  }
)

export default IncidentLayer
