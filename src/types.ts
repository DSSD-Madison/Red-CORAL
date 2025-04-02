export interface Coordinates {
  lat: number
  lng: number
}

export interface Incident {
  description: string
  dateString: string
  typeID: string
  location: Coordinates
  country: string
  department: string // equivalent to province/state
  municipality: string
  deleted?: boolean
}

export interface Category {
  name: string
  color: string
  deleted?: boolean
}

export interface Type {
  name: string
  categoryID: keyof DB['Categories']
  deleted?: boolean
}

export interface DB {
  Categories: {
    [key: string]: Category
  }
  Types: {
    [key: string]: Type
  }
  Incidents: {
    [key: string]: Incident
  }
  filterBounds: FilterBounds
  readAt?: string
  cachedAt?: string
}

export interface MarkerFilters {
  hideCategories: (keyof DB['Categories'])[]
  hideTypes: (keyof DB['Types'])[]
  startYear: number | null
  endYear: number | null
  hideCountries: string[]
  hideDepartments: string[]
  hideMunicipalities: string[]
}

export interface FilterBounds {
  minYear: number
  maxYear: number
  locations: {
    [country: string]: {
      [departments: string]: string[] // municipalities
    }
  }
}
