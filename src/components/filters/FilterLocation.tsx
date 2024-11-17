import React, { useState, useEffect } from 'react'
import { filterProps } from '@/pages/StatsDashboard'
import BaseFilter from './BaseFilter'
import { LucideMapPin } from 'lucide-react'

export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const toRadians = (deg: number) => deg * (Math.PI / 180)
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return 6371 * c
}

const FilterLocation: React.FC<filterProps> = ({ id, dispatch }) => {
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
    <BaseFilter icon={<LucideMapPin />} text={`Location: (${latitude}, ${longitude}) Radius: ${radius}`}>
      <button onClick={removeThisFilter} className="text-red-600">
        Remove Filter
      </button>
      <br />
      <input
        type="number"
        placeholder="Latitude"
        value={latitude}
        onChange={(e) => setLatitude(e.target.value)}
        className="rounded-md border border-gray-300 p-1"
      />
      <input
        type="number"
        placeholder="Longitude"
        value={longitude}
        onChange={(e) => setLongitude(e.target.value)}
        className="rounded-md border border-gray-300 p-1"
      />
      <input
        type="number"
        placeholder="Radius"
        value={radius}
        onChange={(e) => setRadius(e.target.value)}
        className="rounded-md border border-gray-300 p-1"
      />
    </BaseFilter>
  )
}

export default FilterLocation
