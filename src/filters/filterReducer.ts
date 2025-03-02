import { DB, Incident } from 'types'
import React from 'react'
import CategoryFilter from '@/components/filters/CategoryFilter'
import CountryFilter from '@/components/filters/CountryFilter'
import DateFilter from '@/components/filters/DateFilter'
import DescFilter from '@/components/filters/DescFilter'
import LatLongFilter, { calculateDistance } from '@/components/filters/LatLongFilter'

export type filterDispatchType = { type: 'ADD_FILTER' | 'REMOVE_FILTER' | 'UPDATE_FILTER'; payload: Partial<filterType> }

export type filterProps = {
  id: number
  dispatch: React.Dispatch<filterDispatchType>
  state?: any
}

export type filterType = {
  id: number
  type: 'category' | 'country' | 'date' | 'desc' | 'latlong'
  state?: any
}

type reducerType = {
  index: number
  filters: filterType[]
}

export const initialFilterState: reducerType = {
  "index": 6,
  "filters": [
      {
          "id": 0,
          "type": "category",
          "state": {
              "hiddenCategories": [],
              "hiddenTypes": []
          }
      },
      {
          "id": 1,
          "type": "date",
          "state": {
              "date1": "",
              "date2": "",
              "selectedDateFilter": "es entre",
              "isDateFilterSelectOpen": false
          }
      },
      {
          "id": 3,
          "type": "latlong",
          "state": {
              "latitude": "",
              "longitude": "",
              "radius": ""
          }
      },
      {
          "id": 4,
          "type": "country",
          "state": {
              "hiddenCountries": [],
              "hiddenDepartments": [],
              "hiddenMunicipalities": []
          }
      },
      {
          "id": 5,
          "type": "desc",
          "state": {
              "search": ""
          }
      }
  ]
}

export const filterReducer = (state: reducerType, action: filterDispatchType): reducerType => {
  switch (action.type) {
    case 'ADD_FILTER': {
      const id = state.index
      const newFilter = { id, ...action.payload } as filterType
      return { index: state.index + 1, filters: [...state.filters, newFilter] }
    }
    case 'REMOVE_FILTER':
      return { ...state, filters: state.filters.filter((filter) => filter.id !== action.payload.id) }
    case 'UPDATE_FILTER':
      return { ...state, filters: state.filters.map((filter) => (filter.id === action.payload.id ? { ...filter, ...action.payload } : filter)) }
    default:
      return state
  }
}

export const filterComponents: { [key: string]: React.FC<filterProps> } = {
  category: CategoryFilter,
  country: CountryFilter,
  date: DateFilter,
  desc: DescFilter,
  latlong: LatLongFilter,
}

export const filterOperations: { [key: string]: (incident: Incident, state: any, db: DB) => boolean } = {}

filterOperations['category'] = (incident: Incident, state: any, db: DB) => {
  if (!state) return true
  const { hiddenCategories, hiddenTypes } = state
  return !hiddenCategories.includes(db.Types[incident.typeID as string].categoryID as string) && !hiddenTypes.includes(incident.typeID as string)
}

filterOperations['country'] = (incident: Incident, state: any) => {
  if (!state) return true
  const { hiddenCountries, hiddenDepartments, hiddenMunicipalities } = state
  return (
    !hiddenCountries.includes(incident.country) &&
    !hiddenDepartments.includes(`${incident.country} - ${incident.department}`) &&
    !hiddenMunicipalities.includes(`${incident.country} - ${incident.department} - ${incident.municipality}`)
  )
}

filterOperations['date'] = (incident: Incident, state: any) => {
  if (!state) return true
  const { date1, date2, selectedDateFilter } = state
  if (!date1) {
    return true
  }
  switch (selectedDateFilter) {
    case 'es':
      return incident.dateString === date1
    case 'es anterior':
      return incident.dateString < date1
    case 'es posterior':
      return incident.dateString > date1
    case 'es entre':
      if (!date2) {
        return true
      }
      return date1 <= incident.dateString && incident.dateString <= date2
    default:
      return true
  }
}

filterOperations['desc'] = (incident: Incident, state: any) => {
  if (!state) return true
  const { search } = state
  return incident.description.toLowerCase().includes(search.toLowerCase())
}

filterOperations['latlong'] = (incident: Incident, state: any) => {
  if (!state) return true
  const { latitude, longitude, radius } = state
  const lat = parseFloat(latitude)
  const lon = parseFloat(longitude)
  const rad = parseFloat(radius)

  if (!isNaN(lat) && !isNaN(lon) && !isNaN(rad)) {
    if (!incident.location) return false
    const { lat: incLat, lng: incLon } = incident.location
    return calculateDistance(lat, lon, incLat, incLon) <= rad
  }
  return true
}
