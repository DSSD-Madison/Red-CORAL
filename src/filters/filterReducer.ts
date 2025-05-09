import { DB, Incident } from 'types'
import React from 'react'
import CategoryFilter from '@/components/filters/CategoryFilter'
import CountryFilter from '@/components/filters/CountryFilter'
import DateFilter from '@/components/filters/DateFilter'
import DescFilter from '@/components/filters/DescFilter'
import LatLongFilter, { calculateDistance } from '@/components/filters/LatLongFilter'
import NOTFilter, { NOTFilterState } from '@/components/filters/NOTFilter'
import ORFilter, { ORFilterState } from '@/components/filters/ORFilter'

export type filterDispatchType = { type: 'RESET_FILTERS' } | { type: 'REMOVE_FILTER', payload: { id: number } } | { type: 'ADD_FILTER' | 'UPDATE_FILTER'; payload: Partial<filterType> } | { type: 'REPLACE_STATE', payload: reducerType }

export type filterProps = {
  id: number
  dispatch: React.Dispatch<filterDispatchType>
  state?: any
}

export type filterType = {
  id: number
  type: 'category' | 'country' | 'date' | 'desc' | 'latlong' | 'not' | 'or'
  state?: any
}

type reducerType = {
  index: number
  filters: filterType[]
}

export const initialFilterState = (index: number): reducerType => ({
  "index": index + 5,
  "filters": [
    {
      "id": index,
      "type": "category",
      "state": {
        "hiddenCategories": [],
        "hiddenTypes": []
      }
    },
    {
      "id": index + 1,
      "type": "date",
      "state": {
        "date1": "",
        "date2": "",
        "selectedDateFilter": "es entre años",
        "isDateFilterSelectOpen": false
      }
    },
    {
      "id": index + 2,
      "type": "latlong",
      "state": {
        "latitude": "",
        "longitude": "",
        "radius": ""
      }
    },
    {
      "id": index + 3,
      "type": "country",
      "state": {
        "hiddenCountries": [],
        "hiddenDepartments": [],
        "hiddenMunicipalities": []
      }
    },
    {
      "id": index + 4,
      "type": "desc",
      "state": {
        "search": ""
      }
    }
  ]
})

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
    case 'RESET_FILTERS':
      return initialFilterState(state.index)
    case 'REPLACE_STATE': {
      let id = state.index // can't just copy action.payload directly, because if we don't change react's keys it won't re-render. gotta drop in and update the keys
      const newFilters = action.payload.filters.map((filter) => {
        if (filter.id === undefined) {
          return { ...filter, id: id++ } // give it a new id
        }
        return filter
      })
      return { ...action.payload, filters: newFilters, index: id }
    }
    default:
      return state
  }
}

export const filterComponents: Record<filterType["type"], React.FC<filterProps>> = {
  category: CategoryFilter,
  country: CountryFilter,
  date: DateFilter,
  desc: DescFilter,
  latlong: LatLongFilter,
  not: NOTFilter,
  or: ORFilter
}

// filters return true if the incident should be shown, false if it should be hidden, and undefined if the filter isn't initialized yet
// if one uninitialized filter returns true for everything, that produces bad behavior in the NOT (false for everything) and OR filters (true for everything)
export const filterOperations: Record<filterType["type"], (incident: Incident, state: any, db: DB) => boolean | undefined> = {
  category: (incident: Incident, state: any, db: DB) => {
    if (!state) return undefined
    const { hiddenCategories, hiddenTypes } = state as { hiddenCategories: string[], hiddenTypes: string[] }
    if (Array.isArray(incident.typeID)) {
      return incident.typeID.some(typeID => !hiddenCategories.includes(db.Types[typeID].categoryID as string)) &&
        incident.typeID.some(typeID => !hiddenTypes.includes(typeID));
    }
    return !hiddenCategories.includes(db.Types[incident.typeID].categoryID as string) && !hiddenTypes.includes(incident.typeID)
  },
  country: (incident: Incident, state: any) => {
    if (!state) return undefined
    const { hiddenCountries, hiddenDepartments, hiddenMunicipalities } = state
    return (
      !hiddenCountries.includes(incident.country) &&
      !hiddenDepartments.includes(`${incident.country} - ${incident.department}`) &&
      !hiddenMunicipalities.includes(`${incident.country} - ${incident.department} - ${incident.municipality}`)
    )
  },
  date: (incident: Incident, state: any) => {
    if (!state) return undefined
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
      case 'es entre años':
      case 'es entre':
        if (!date2) {
          return true
        }
        return date1 <= incident.dateString && incident.dateString <= date2
      default:
        return true
    }
  },
  desc: (incident: Incident, state: any) => {
    if (!state) return undefined
    const { search } = state
    return incident.description.toLowerCase().includes(search.toLowerCase())
  },
  latlong: (incident: Incident, state: any) => {
    if (!state) return undefined
    const { latitude, longitude, radius } = state
    const lat = parseFloat(latitude)
    const lon = parseFloat(longitude)
    const rad = parseFloat(radius)

    if (!isNaN(lat) && !isNaN(lon) && !isNaN(rad)) {
      if (!incident.location) return undefined
      const { lat: incLat, lng: incLon } = incident.location
      return calculateDistance(lat, lon, incLat, incLon) <= rad
    }
    return true
  },
  not: (incident: Incident, state: NOTFilterState["state"], db: DB) => {
    if (!state || state.filters.length === 0) return undefined
    // return false if any of the filters return true
    return state.filters.some((filter) => filterOperations[filter.type](incident, filter.state, db) !== true)
  },
  or: (incident: Incident, state: ORFilterState["state"], db: DB) => {
    if (!state || state.filters.length === 0) return undefined
    // return true if any of the filters return true
    return state.filters.some((filter) => filterOperations[filter.type](incident, filter.state, db) !== false)
  }
}
