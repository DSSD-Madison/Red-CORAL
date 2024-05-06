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
  editID: keyof DB['Incidents'] | null
}

const IncidentLayer = forwardRef<any, IncidentLayerProps>(
  ({ data, selectedIncidentID, setSelectedIncidentID, isAdmin, tmpLocation, setTmpLocation, tmpSelected, setTmpSelected, filters, editID }, ref) => {
    const map = useMap()

    map.removeEventListener('dblclick')
    map.addEventListener('dblclick', (e) => {
      if (!isAdmin || !(tmpSelected || editID != null)) return
      setTmpLocation(e.latlng)
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
      ([id, incident]) =>
        (!filters.startYear || new Date(incident.dateString).getFullYear() >= filters.startYear) &&
        (!filters.endYear || new Date(incident.dateString).getFullYear() <= filters.endYear) &&
        !filters.hideCountries.includes(incident.country) &&
        !filters.hideDepartments.includes(incident.department) &&
        !filters.hideMunicipalities.includes(incident.municipality) &&
        !filters.hideCategories.includes(data.Types[incident.typeID].categoryID) &&
        !filters.hideTypes.includes(incident.typeID) &&
        (editID == null || id != editID)
    )

    const typeColors = Object.fromEntries(Object.entries(data?.Types || {}).map(([id, type]) => [id, data.Categories[type.categoryID].color]))

    return (
      <LayerGroup ref={ref}>
        <svg style={{ display: 'none' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18">
          <symbol id="marker">
            <circle r="9" cx="9" cy="9" fill="currentColor" />
          </symbol>
        </svg>
        {incidentList.map(([id, incident], i) => (
          <LeafletMarker
            key={`incident-${i}-marker`}
            title={incident.description}
            position={incident.location}
            icon={L.divIcon({
              iconSize: id == selectedIncidentID ? [20, 20] : [15, 15],
              className: '',
              html: `<svg viewBox="0 0 18 18" ${id == selectedIncidentID ? 'width="20px" height="20px"' : 'width="15px" height="15px"'} style="color: ${id == selectedIncidentID ? 'red' : typeColors[incident.typeID]};">
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
            title={'Incidente incompleto'}
            position={tmpLocation}
            icon={L.divIcon({
              iconSize: [20, 20],
              className: '',
              html: `<svg viewBox="0 0 18 18" width="20px" height="20px" style="color: red; opacity: 0.5;">
                      <use href="#marker" />
                    </svg>`,
            })}
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
