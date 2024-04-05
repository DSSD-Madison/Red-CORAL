export interface Coordinates {
  lat: number
  lng: number
}

export interface Incident {
  name: string
  description: string
  dateString: string
  typeID: keyof DB['Types']
  location: Coordinates[]
  isTest?: boolean // if true, should only be visible to admins i.e. not saved into Cloud Storage
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
}

export interface MarkerFilters {
  showCategories?: [keyof DB['Categories']]
  showTypes?: [keyof DB['Types']]
  startYear?: number
  endYear?: number
}
