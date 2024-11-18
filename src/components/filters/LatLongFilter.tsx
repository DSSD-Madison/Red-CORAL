import React, { useState, useEffect } from 'react'
import { filterProps } from '@/pages/StatsDashboard'
import BaseFilter from './BaseFilter'
import { LucideMapPin, LucideTrash2 } from 'lucide-react'

export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const toRadians = (deg: number) => deg * (Math.PI / 180)
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return 6371 * c
}

const LatLongFilter: React.FC<filterProps> = ({ id, dispatch }) => {
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [radius, setRadius] = useState('')

  useEffect(() => {
    const lat = parseFloat(latitude)
    const lon = parseFloat(longitude)
    const rad = parseFloat(radius)

    if (!isNaN(lat) && !isNaN(lon) && !isNaN(rad)) {
      dispatch({
        type: 'UPDATE_FILTER',
        payload: {
          id: id,
          operation: (incident) => {
            if (!incident.location) return false
            const { lat: incLat, lng: incLon } = incident.location
            return calculateDistance(lat, lon, incLat, incLon) <= rad
          },
        },
      })
    }
  }, [latitude, longitude, radius, id, dispatch])

  const removeThisFilter = () => {
    dispatch({ type: 'REMOVE_FILTER', payload: { id } })
  }

  return (
    <BaseFilter icon={<LucideMapPin />} text={`Ubicación: (${latitude || 0}, ${longitude || 0}) Radio: ${radius || 'N/A'}`}>
      <button onClick={removeThisFilter} className="absolute right-2 top-1 h-4 w-4 text-red-600" title="Eliminar Filtro">
        <LucideTrash2 size={20} />
      </button>
      <br />
      <input
        type="number"
        placeholder="Latitud"
        value={latitude}
        onChange={(e) => setLatitude(e.target.value)}
        className="rounded-md border border-gray-300 p-1"
      />
      <input
        type="number"
        placeholder="Longitud"
        value={longitude}
        onChange={(e) => setLongitude(e.target.value)}
        className="rounded-md border border-gray-300 p-1"
      />
      <input
        type="number"
        placeholder="Radio"
        value={radius}
        onChange={(e) => setRadius(e.target.value)}
        className="rounded-md border border-gray-300 p-1"
      />
    </BaseFilter>
  )
}

export default LatLongFilter
