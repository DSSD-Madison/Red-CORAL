import React, { useState, useRef, useEffect } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import { Incident, MarkerFilters } from 'types'
import SearchControl from '@/components/controls/SearchControl'
import IncidentPanel from '@/components/controls/IncidentPanel'
import ZoomControl from '@/components/controls/ZoomControl'
import IncidentLayer from '@/components/layers/IncidentLayer'
import { LatLngBoundsLiteral, LatLngTuple } from 'leaflet'
import CategoryControl from '@/components/controls/CategoryControl'
import YearControl from '@/components/controls/YearControl'
import CountryControl from '@/components/controls/CountryControl'
import MarkerTypeControl from '@/components/controls/MarkerTypeControl'
import Control from 'react-leaflet-custom-control'
import { INITIAL_BOUNDS, INITIAL_ZOOM } from '@/constants'
import { useLocation } from 'react-router-dom'
import { useDB } from '../context/DBContext'

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

const Map: React.FC = () => {
  const { addIncident, deleteIncident, editIncident, isLoggedIn: isAdmin, db } = useDB()
  const apiKey = import.meta.env.VITE_STADIA_KEY
  const maxBounds: LatLngBoundsLiteral = [
    // Southwest coordinate
    [-90, -180],
    // Northeast coordinate
    [90, 180],
  ]

  const [selectedIncidentID, setSelectedIncidentID] = useState<string | null>(null)
  const [filters, setFilters] = useState<MarkerFilters>({
    hideCategories: [],
    hideTypes: [],
    startDate: null,
    endDate: null,
    hideCountries: [],
    hideDepartments: [],
    hideMunicipalities: [],
  })
  const [tmpSelected, setTmpSelected] = useState<boolean>(false)
  const markersLayer = useRef(null)
  const [markerDisplayType, setMarkerDisplayType] = useState<'single' | 'group' | 'groupPie'>('groupPie')
  const [location, setLocation] = useState<Incident['location'] | null>(null)
  const [editID, setEditID] = useState<string | null>(null)

  async function submitIncident(
    dateString: Incident['dateString'],
    typeID: Incident['typeID'],
    description: Incident['description'],
    country: Incident['country'],
    department: Incident['department'],
    municipality: Incident['municipality'],
    incidentID: string | null
  ): Promise<boolean> {
    if (!dateString) {
      alert('Por, favor, selecciona una fecha para el incidente')
      return false
    }

    if (!Object.keys(db.Types).some((id) => id == typeID)) {
      alert('Tipo de evento no válido, algo salió mal')
      return false
    }

    if (!location) {
      alert('Por favor, selecciona una lugar en el mapa')
      return false
    }
    if (incidentID != null) {
      if (!(await editIncident(incidentID, { description, dateString, typeID, location, country, department, municipality }))) {
        alert('No se pudo editar el incidente')
        return false
      }
      alert('Incidente editado con éxito')
    } else {
      if (!(await addIncident({ description, dateString, typeID, location, country, department, municipality }))) {
        alert('No se pudo crear el incidente')
        return false
      }
      alert('Incidente creado con éxito')
    }
    return true
  }

  async function deleteSelectedIncident() {
    if (!selectedIncidentID || confirm('¿Estás seguro de que quieres eliminar este incidente?') === false) return
    if (await deleteIncident(selectedIncidentID)) {
      setSelectedIncidentID(null)
      alert('Incidente eliminado con éxito')
    } else {
      alert('No se pudo eliminar el incidente')
    }
  }

  function onClose() {
    setSelectedIncidentID(null)
    setTmpSelected(false)
    setLocation(null)
  }

  return (
    <div className="relative h-full">
      <MapContainer
        className="h-full w-full focus-visible:outline-none"
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
          data={db}
          selectedIncidentID={selectedIncidentID}
          setSelectedIncidentID={setSelectedIncidentID}
          ref={markersLayer}
          isAdmin={isAdmin}
          tmpLocation={location}
          setTmpLocation={setLocation}
          tmpSelected={tmpSelected}
          filters={filters}
          editID={editID}
          markerType={markerDisplayType}
        />
        <IncidentPanel
          incidentID={selectedIncidentID}
          onClose={onClose}
          submitIncident={submitIncident}
          location={location}
          setLocation={setLocation}
          tmpSelected={tmpSelected}
          setTmpSelected={setTmpSelected}
          isAdmin={isAdmin}
          deleteSelectedIncident={deleteSelectedIncident}
          setEditID={setEditID}
          editID={editID}
        />
        <Control prepend position="topleft">
          <div className="leaflet-bar">
            <SearchControl />
            <CategoryControl filters={filters} setFilters={setFilters} />
            <CountryControl filters={filters} setFilters={setFilters} />
            <MarkerTypeControl markerType={markerDisplayType} setMarkerType={setMarkerDisplayType} />
          </div>
        </Control>
        <Control position="bottomleft">
          <YearControl filters={filters} setFilters={setFilters} setDisplayType={setMarkerDisplayType} />
        </Control>
        <ZoomControl zoomLevel={2} setFilters={setFilters} />
        <SetInitialBounds />
      </MapContainer>
      <div className="w-30% absolute bottom-0 right-0 z-[750] pb-10 pr-3 text-sm">
        {isAdmin && (
          <div className="float-right flex flex-col gap-2 text-center">
            <button
              className="rounded-md bg-white p-2 hover:bg-neutral-300"
              onClick={() => {
                setSelectedIncidentID(null)
                setTmpSelected(true)
              }}
            >
              Crear incidente
            </button>
            <a
              href="https://firebasestorage.googleapis.com/v0/b/redcoralmap.appspot.com/o/state.json?alt=media"
              className="block rounded-md bg-blue-500 p-2 text-white hover:bg-blue-600"
            >
              Guardar copia de datos
            </a>
          </div>
        )}
        <div>
          <img src="banner.png" alt="Red CORAL logo" className="float-right block w-64 drop-shadow filter" />
        </div>
      </div>
    </div>
  )
}

export default Map
