import L, { LatLngTuple, PointTuple } from 'leaflet'
import { forwardRef, useEffect, useMemo, useState } from 'react'
import { useMap, Marker as LeafletMarker, Tooltip } from 'react-leaflet'
import { DB, Incident, MarkerFilters } from 'types'
import { filterIncidents, typeIDtoCategory, typeIDtoCategoryID, typeIDtoTypeName } from 'utils'
import MarkerClusterGroup from 'react-leaflet-markercluster'
import { db } from '@/context/DBContext' // still need to import for the marker icon functions

interface IncidentLayerProps {
  data: DB // not using context here so we can be fed whatever points we want
  selectedIncidentID: keyof DB['Incidents'] | null
  setSelectedIncidentID: React.Dispatch<React.SetStateAction<string | null>>
  isAdmin: boolean
  tmpLocation: Incident['location'] | null
  setTmpLocation: React.Dispatch<React.SetStateAction<Incident['location'] | null>>
  tmpSelected: boolean
  filters: MarkerFilters
  editID: keyof DB['Incidents'] | null
  markerType: 'group' | 'groupPie' | 'single'
}

const greyClusterIcon = (cluster: L.MarkerCluster) => {
  const total = cluster.getChildCount()
  const startShade = 160
  const endShade = 32
  const endColorThresh = 200
  const color = Math.round(Math.min(1, Math.sqrt(total / endColorThresh)) * (endShade - startShade) + startShade).toString(16)
  const size = Math.round(Math.pow(total, 0.25) * 15)
  return L.divIcon({
    html: `<div style="background-color:#${color}${color}${color}a0;line-height:${size}px;height:${size}px;width:${size}px;">${total}</div>`,
    className: 'marker-grey',
    iconSize: L.point(size, size, true),
  })
}

const pieChartClusterIcon = (cluster: L.MarkerCluster) => {
  // this function is very hot!!! (called for every cluster on every zoom change)
  const children = cluster.getAllChildMarkers() as (L.Marker<any> & { options: { catID: string } })[]
  const total = children.length
  // No cache, tragic
  const proportions = {} as Record<string, number>
  let catID
  for (let i = 0; i < children.length; i++) {
    catID = children[i].options.catID
    proportions[catID] = (proportions[catID] || 0) + 1
  }
  // pie chart rendered using CSS conic gradient.
  // need end percent and color per category -> (conic-gradient(orange 64%, blue 64%, blue 81%, black 81%);)
  // Filter and sort categories by proportion
  const entries = Object.entries(proportions)
    .filter(([_, count]) => count / total > 0.05)
    .sort((a, b) => b[1] - a[1])

  const length = entries.length
  const slices: [number[], string[]] = [new Array(length), new Array(length)]

  let runningTotal = 0
  for (let i = 0; i < length; i++) {
    const [catID, count] = entries[i]
    runningTotal += (count / total) * 100
    slices[0][i] = runningTotal
    slices[1][i] = db.Categories[catID].color
  }
  // Add the remainder if needed
  if (slices[0][slices[0].length - 1] < 100) {
    slices[0].push(100)
    slices[1].push('#777777')
  }
  const slicesString = []
  for (let i = 0; i < slices[0].length; i++) {
    const color = slices[1][i]
    const start = i === 0 ? 0 : slices[0][i - 1]
    const end = slices[0][i]
    slicesString.push(`${color}e0 ${Math.ceil(start)}%, ${color}e0 ${Math.floor(end)}%`)
  }
  const size = Math.round(Math.pow(total, 0.25) * 15)
  const icon = L.divIcon({
    html: `<div style="background: conic-gradient(${slicesString.join(',')})"></div>`,
    className: 'marker-pie',
    iconSize: L.point(size, size, true),
  })
  return icon
}

const IncidentLayer = forwardRef<any, IncidentLayerProps>(
  ({ data, selectedIncidentID, setSelectedIncidentID, isAdmin, tmpLocation, setTmpLocation, tmpSelected, filters, editID, markerType }, ref) => {
    const map = useMap()
    const [zoomLevel, setZoomLevel] = useState<number>(map.getZoom())
    const isGroupingEnabled = markerType !== 'single'

    const zoomToLocation = (location: Incident['location'] | null) => {
      if (!location) return
      // Incident location can be arbitrary number of coordinate
      const path = [location].map((coords) => [coords.lat, coords.lng] as LatLngTuple)
      // Leaflet expects rectangular bounds
      const bounds = L.latLngBounds([
        [Math.min(...path.map((coords) => coords[0])), Math.min(...path.map((coords) => coords[1]))],
        [Math.max(...path.map((coords) => coords[0])), Math.max(...path.map((coords) => coords[1]))],
      ])
      map.flyToBounds(bounds, { maxZoom: 15 })
    }

    // Registering event listeners for zoom and double click events.
    useEffect(() => {
      const clickHandler = (e: L.LeafletMouseEvent) => {
        if (!isAdmin || (!tmpSelected && editID == null)) return
        setTmpLocation(e.latlng)
      }
      const zoomHandler = () => {
        setZoomLevel(() => map.getZoom())
      }
      map.addEventListener('dblclick', clickHandler)
      map.addEventListener('zoomend', zoomHandler)
      return () => {
        map.removeEventListener('zoomend', zoomHandler)
        map.removeEventListener('dblclick', clickHandler)
      }
    }, [isAdmin, tmpSelected, editID, map])

    // Filtering incidents based on the current filters.
    const incidentList = useMemo(() => filterIncidents(data.Incidents, filters, data.Types, editID), [data, filters, editID])

    // Map of types to colors (normally only categories have an associated color).
    const typeColors = Object.fromEntries(Object.entries(data?.Types || {}).map(([id, type]) => [id, data.Categories[type.categoryID].color]))
    const typeIDtoTypeColors = (typeID: string | string[]) => {
      return typeColors[Array.isArray(typeID) ? typeID[0] : typeID]
    }

    const markerSize = (id: string): PointTuple => (id == selectedIncidentID ? [20, 20] : zoomLevel > 12 ? [15, 15] : [10, 10])
    const createMarkerSVG = (id: string, incident: Incident): string => {
      const size = markerSize(id)[0]
      return `<svg viewBox="0 0 18 18" width="${size}px" height="${size}px" style="color: ${id == selectedIncidentID ? 'red' : typeIDtoTypeColors(incident.typeID)};">
        <use href="#marker" />
      </svg>`
    }

    return (
      <>
        {/* @ts-expect-error: MarkerClusterGroup typings do not include children */}
        <MarkerClusterGroup
          key={markerType}
          ref={ref}
          showCoverageOnHover={false}
          disableClusteringAtZoom={isGroupingEnabled ? 13 : 0}
          spiderfyOnMaxZoom={false}
          iconCreateFunction={markerType === 'groupPie' ? pieChartClusterIcon : greyClusterIcon}
        >
          <svg style={{ display: 'none' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18">
            <symbol id="marker">
              <circle r="9" cx="9" cy="9" fill="currentColor" />
            </symbol>
          </svg>
          {incidentList.map(([id, incident]) => (
            <LeafletMarker
              key={id}
              position={incident.location}
              icon={L.divIcon({
                iconSize: [15, 15],
                className: '',
                html: createMarkerSVG(id, incident),
              })}
              // @ts-expect-error: passing catID to marker options so we can use it for the cluster icon
              catID={typeIDtoCategoryID(data, incident.typeID)}
              eventHandlers={{
                click: () => {
                  if (selectedIncidentID === id) {
                    setSelectedIncidentID(null)
                  } else {
                    setSelectedIncidentID(id)
                    zoomToLocation(incident.location)
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
                  {incident.department && (
                    <p>
                      <span className="font-bold">Departamento:</span> {incident.department}
                    </p>
                  )}
                  {incident.municipality && (
                    <p>
                      <span className="font-bold">Municipalidad:</span> {incident.municipality}
                    </p>
                  )}
                  <p>
                    <span className="font-bold">Fecha:</span> {incident.dateString}
                  </p>
                  <hr className="my-2 border-neutral-500" />
                  <p>
                    <span className="font-bold">Actividad:</span> {typeIDtoCategory(data, incident.typeID).name}
                    <span
                      className="ml-1 inline-block h-[1em] w-[1em] rounded-full"
                      style={{ backgroundColor: typeIDtoTypeColors(incident.typeID) }}
                    />
                  </p>
                  <p>
                    <span className="font-bold">Tipo de evento:</span> {typeIDtoTypeName(data, incident.typeID)}
                  </p>
                </div>
              </Tooltip>
            </LeafletMarker>
          ))}
        </MarkerClusterGroup>
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
      </>
    )
  }
)

export default IncidentLayer
