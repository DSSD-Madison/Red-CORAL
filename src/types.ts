export interface Coordinates {
  lat: number
  lng: number
}

export interface Incident {
  name: string
  description: string
  dateString: string
  typeID: keyof DB['Types']
  location: Coordinates
  country: string
  department: string,
  municipality: string
}

export interface Category {
  name: string
  color: string
}

export interface Type {
  name: string
  categoryID: keyof DB['Categories']
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
}

export interface MarkerFilters {
  hideCategories: (keyof DB['Categories'])[]
  hideTypes: (keyof DB['Types'])[]
  startYear: number | null
  endYear: number | null
}

export interface FilterBounds {
  minYear: number
  maxYear: number
  countries?: (keyof FilterBounds['provinces'])[]
  provinces?: {
    [country: string]: string[]
  }
}
