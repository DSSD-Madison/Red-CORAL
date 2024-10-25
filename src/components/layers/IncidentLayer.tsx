import L, { LatLngTuple } from 'leaflet'
import { forwardRef } from 'react'
import { useMap, Marker as LeafletMarker, LayerGroup, Tooltip } from 'react-leaflet'
import { DB, Incident, MarkerFilters } from 'types'

interface IncidentLayerProps {
  data: DB
  selectedIncidentID: keyof DB['Incidents'] | null
  setSelectedIncidentID: React.Dispatch<React.SetStateAction<keyof DB['Incidents'] | null>>
  isAdmin: boolean
  tmpLocation: Incident['location'] | null
  setTmpLocation: React.Dispatch<React.SetStateAction<Incident['location'] | null>>
  tmpSelected: boolean
  filters: MarkerFilters
  editID: keyof DB['Incidents'] | null
}

const IncidentLayer = forwardRef<any, IncidentLayerProps>(
  ({ data, selectedIncidentID, setSelectedIncidentID, isAdmin, tmpLocation, setTmpLocation, tmpSelected, filters, editID }, ref) => {
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
      map.flyToBounds(bounds, { maxZoom: 10 })
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
            key={id}
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
          >
            <Tooltip
              direction={incident.location.lat < map.getCenter().lat ? 'top' : 'bottom'}
              offset={[0, incident.location.lat < map.getCenter().lat ? -8 : 8]}
            >
              <div className="w-max min-w-24 max-w-72 text-wrap break-words">
                <p>
                  <span className="font-bold">Pais:</span> {incident.country}
                </p>
                <p>
                  <span className="font-bold">Municipalidad:</span> {incident.municipality}
                </p>
                <p>
                  <span className="font-bold">Fecha:</span> {new Date(incident.dateString).toLocaleDateString('es-ES', { timeZone: 'UTC' })}
                </p>
                <p>
                  <span className="font-bold">Actividad:</span> {data.Categories[data.Types[incident.typeID].categoryID].name}
                </p>
                <p>
                  <span className="font-bold">Tipo de evento:</span> {data.Types[incident.typeID].name}
                </p>
              </div>
            </Tooltip>
          </LeafletMarker>
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
      </LayerGroup>
    )
  }
)

export default IncidentLayer
