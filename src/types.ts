export interface Coordinates {
  lat: number
  lng: number
}

export interface Incident {
  name: string
  description: string
  year: number
  countries: string[]
  typeID: string
  location: Coordinates[]
}

export interface Category {
  name: string
}

export interface Type {
  name: string
  categoryID: string
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
