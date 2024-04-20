import { Incident, Category, Type, DB, FilterBounds } from 'types'
import { collection, getDocs, Firestore } from 'firebase/firestore'
import { ref, getBytes, FirebaseStorage } from 'firebase/storage'

export async function getDBData(isAdmin: boolean, firestore: Firestore, storage: FirebaseStorage) {
  if (isAdmin) {
    const db: DB = {
      Categories: {},
      Types: {},
      Incidents: {},
      filterBounds: {
        maxYear: 0,
        minYear: 0,
        locations: {},
      },
    }
    // prettier-ignore
    const [catSnap, typeSnap, incSnap] = await Promise.all([
      getDocs(collection(firestore, 'Categories')),
      getDocs(collection(firestore, 'Types')),
      getDocs(collection(firestore, 'Incidents')),
    ])
    catSnap.forEach((doc) => {
      const cat = doc.data() as Category
      db.Categories[doc.id] = cat
    })
    typeSnap.forEach((doc) => {
      const type = doc.data() as Type
      db.Types[doc.id] = type
    })
    incSnap.forEach((doc) => {
      const inc = doc.data() as Incident
      db.Incidents[doc.id] = inc
    })
    return db
  } else {
    const bytes = await getBytes(ref(storage, 'state.json'))
    const db: DB = JSON.parse(new TextDecoder().decode(bytes))
    return db
  }
}

/**
 * Finds the minimum and maximum years in the data and creates a structured list of all locations within the data
 * @param db a database object
 * @returns the same database object with the filterBounds property filled in
 */
export function calculateBounds(db: DB): DB {
  const allYears = new Set(Object.values(db.Incidents).map((e) => new Date(e.dateString).getFullYear()))
  const minYear = Math.min(...allYears)
  const maxYear = Math.max(...allYears)
  const locations = Object.values(db.Incidents).reduce(
    (acc, curr) => {
      if (!acc[curr.country]) {
        acc[curr.country] = {}
      }
      if (!acc[curr.country][curr.department]) {
        acc[curr.country][curr.department] = []
      }
      if (!acc[curr.country][curr.department].includes(curr.municipality)) {
        acc[curr.country][curr.department].push(curr.municipality)
      }
      return acc
    },
    {} as FilterBounds['locations']
  ) as FilterBounds['locations']

  return {
    ...db,
    filterBounds: {
      maxYear,
      minYear,
      locations,
    },
  } as DB
}