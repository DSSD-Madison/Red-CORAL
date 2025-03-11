import React, { useState } from 'react'
import { filterProps } from '@/filters/filterReducer'
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

interface LatLongFilterState extends filterProps {
  state?: {
    latitude: string
    longitude: string
    radius: string
  }
}

const LatLongFilter: React.FC<filterProps> = ({ id, dispatch, state }: LatLongFilterState) => {
  const [latitude, setLatitude] = useState(state?.latitude || '')
  const [longitude, setLongitude] = useState(state?.longitude || '')
  const [radius, setRadius] = useState(state?.radius || '')

  const filterStringDisplay = latitude || longitude || radius ? `: (${latitude || 0}, ${longitude || 0}) Radio: ${radius || 0}km` : ''
  return (
    <BaseFilter icon={<LucideMapPin />} text={'Ubicación' + filterStringDisplay} dispatch={dispatch} id={id}>
      <div className="my-2 flex gap-2">
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
          placeholder="Radio (km)"
          value={radius}
          onChange={(e) => setRadius(e.target.value)}
          className="rounded-md border border-gray-300 p-1"
        />
        <button
          onClick={() =>
            dispatch({
              type: 'UPDATE_FILTER',
              payload: {
                id: id,
                state: { latitude, longitude, radius },
              },
            })
          }
          className="rounded bg-blue-500 px-2 py-1 text-white"
        >
          Aplicar
        </button>
      </div>
    </BaseFilter>
  )
}

export default LatLongFilter
