import { LatLngBoundsLiteral, LatLngTuple } from 'leaflet'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import ZoomControl from '@/components/controls/ZoomControl'
import IncidentLayer from '@/components/layers/IncidentLayer'
import { DB, Incident, MarkerFilters } from '@/types'
import { useLocation } from 'react-router'
import { useEffect } from 'react'
import { INITIAL_BOUNDS, INITIAL_ZOOM } from '@/constants'
import { useDB } from '@/context/DBContext'

interface StatisticsFilterMapProps {
  incidents: [string, Incident][]
}

function SetInitialBounds() {
  const location = useLocation()
  const map = useMap()
  const coordinates = location.state?.coord
  useEffect(() => {
    if (coordinates) {
      // If coordinates are provided, zoom to that location
      const coords: LatLngTuple = [coordinates.lat, coordinates.lng]
      map.setView(coords, 15)
    } else {
      // Otherwise, set to the default
      map.setView(INITIAL_BOUNDS, INITIAL_ZOOM)
    }
  }, [coordinates])
  return null
}

export default function StatisticsFilterMap({ incidents }: StatisticsFilterMapProps) {
  const { db } = useDB()
  const apiKey = import.meta.env.VITE_STADIA_KEY
  const maxBounds: LatLngBoundsLiteral = [
    // Southwest coordinate
    [-90, -180],
    // Northeast coordinate
    [90, 180],
  ]
  const filters: MarkerFilters = {
    hideCategories: [],
    hideTypes: [],
    startDate: null,
    endDate: null,
    hideCountries: [],
    hideDepartments: [],
    hideMunicipalities: [],
  }

  // Create a shallow copy of the database and inject filtered incidents into it
  const filteredData: DB = { Types: {}, Categories: {}, Incidents: {}, filterBounds: { minYear: 0, maxYear: 0, locations: {} } }
  Object.assign(filteredData, db)
  filteredData.Incidents = Object.fromEntries(incidents)

  return (
    <div className="relative h-[calc(100vh-128px)] w-full grow overflow-hidden rounded-lg">
      <MapContainer
        className="z-0 h-full w-full focus-visible:outline-none"
        center={[20, 0]}
        zoom={2}
        zoomSnap={0.1}
        zoomDelta={1}
        wheelPxPerZoomLevel={80}
        wheelDebounceTime={100}
        minZoom={2}
        maxZoom={18} // We can adjust this later depending on how detailed the data is.
        scrollWheelZoom={true}
        zoomControl={false}
        maxBounds={maxBounds}
        doubleClickZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={`https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}{r}.png?api_key=${apiKey}`}
        />
        <IncidentLayer
          data={filteredData}
          selectedIncidentID={null}
          setSelectedIncidentID={() => {}}
          ref={null}
          isAdmin={false}
          tmpLocation={null}
          setTmpLocation={() => {}}
          tmpSelected={false}
          filters={filters}
          editID={null}
          markerType="single"
        />
        <ZoomControl zoomLevel={2} setFilters={() => {}} />
        <SetInitialBounds />
      </MapContainer>
    </div>
  )
}
