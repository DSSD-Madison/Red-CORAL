import { DB } from './types'
export const dummyData: DB = {
  Categories: {
    category1: {
      name: 'Category 1',
    },
    category2: {
      name: 'Category 2',
    },
  },
  Types: {
    type1: {
      name: 'Type 1',
      categoryID: 'category1',
    },
    type2: {
      name: 'Type 2',
      categoryID: 'category2',
    },
  },
  Incidents: {
    incident1: {
      name: 'Incident 1',
      description: 'Description of incident 1',
      year: 2022,
      countries: ['Country1', 'Country2'],
      typeID: 'type1',
      location: [{ lat: 1.23, lng: 4.56 }],
    },
    incident2: {
      name: 'Incident 2',
      description: 'Description of incident 2',
      year: 2023,
      countries: ['Country3', 'Country4'],
      typeID: 'type2',
      location: [{ lat: 7.89, lng: 10.11 }],
    },
    incident3: {
      name: 'Incident 3',
      description: 'Description of incident 3',
      year: 2024,
      countries: ['Country5', 'Country6'],
      typeID: 'type1',
      location: [{ lat: -27, lng: -60 }],
    },
  },
}
