import L, { LatLngTuple, PointTuple } from 'leaflet'
import { forwardRef, useEffect, useMemo, useState } from 'react'
import { useMap, Marker as LeafletMarker, Tooltip } from 'react-leaflet'
import { DB, Incident, MarkerFilters } from 'types'
import { filterIncidents, formatDateString, typeIDtoCategory, typeIDtoCategoryID, typeIDtoTypeName } from 'utils'
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
  return L.divIcon({
    html: `<div style="background-color:#777a;line-height:30px;color:white;">${cluster.getChildCount()}</div>`,
    className: 'marker-cluster',
    iconSize: L.point(40, 40, true),
  })
}

const pieChartClusterIcon = (cluster: L.MarkerCluster) => {
  // this function is very hot!!! (called for every cluster on every zoom change)
  const children = cluster.getAllChildMarkers()
  const total = children.length
  const proportions = children.reduce(
    (acc, marker: any) => {
      const catID = marker.options.catID
      acc[catID] = (acc[catID] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )
  // pie chart rendered using CSS conic gradient.
  // need end percent and color per category -> (conic-gradient(orange 64%, blue 64%, blue 81%, black 81%);)
  const slices = Object.entries(proportions)
    // filter out categories with less than 5% of the total (less clutter)
    .filter(([_, count]) => count / total > 0.05)
    .sort((a, b) => b[1] - a[1])
    .reduce(
      (acc, [catID, count], i) => {
        const start = acc[0][i - 1] || 0
        const end = start + (count / total) * 100
        acc[0].push(end)
        acc[1].push(db.Categories[catID].color)
        return acc
      },
      // doing 'list of two lists' instead of 'list of objects' to avoid allocating objects in the loop, even if it's a bit clunky
      // [[0, 64, 100], ['orange', 'blue', 'black']] (this did actually help performance)
      [[], []] as [end: number[], color: string[]]
    )
  if (slices[0][slices[0].length - 1] < 100) {
    slices[0].push(100)
    slices[1].push('#777')
  }
  const slicesString = []
  for (let i = 0; i < slices[0].length; i++) {
    const color = slices[1][i]
    const start = i === 0 ? 0 : slices[0][i - 1]
    const end = slices[0][i]
    slicesString.push(`${color} ${start}%, ${color} ${end}%`)
  }
  const size = Math.round(Math.pow(total, 0.25) * 15)
  return L.divIcon({
    html: `<div style="background: conic-gradient(${slicesString.join(',')})"></div>`,
    className: 'marker-pie',
    iconSize: L.point(size, size, true),
  })
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

    const markerSize = (id: string): PointTuple => (id == selectedIncidentID ? [20, 20] : zoomLevel > 12 ? [15, 15] : [10, 10])
    const createMarkerSVG = (id: string, incident: Incident): string => {
      const size = markerSize(id)[0]
      return `<svg viewBox="0 0 18 18" width="${size}px" height="${size}px" style="color: ${id == selectedIncidentID ? 'red' : typeColors[incident.typeID]};">
        <use href="#marker" />
      </svg>`
    }

    return (
      // @ts-expect-error: MarkerClusterGroup typings do not include children
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
                  <span className="font-bold">Fecha:</span> {formatDateString(incident.dateString)}
                </p>
                <hr className="my-2 border-neutral-500" />
                <p>
                  <span className="font-bold">Actividad:</span> {typeIDtoCategory(data, incident.typeID).name}
                  <span className="ml-1 inline-block h-[1em] w-[1em] rounded-full" style={{ backgroundColor: typeColors[incident.typeID] }} />
                </p>
                <p>
                  <span className="font-bold">Tipo de evento:</span> {typeIDtoTypeName(data, incident.typeID)}
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
      </MarkerClusterGroup>
    )
  }
)

export default IncidentLayer
