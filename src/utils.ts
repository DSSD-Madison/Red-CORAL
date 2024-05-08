import { DB, FilterBounds } from 'types'
import { addDoc, setDoc, serverTimestamp, DocumentReference, CollectionReference, Timestamp } from 'firebase/firestore'

/**
 * Finds the minimum and maximum years in the data and creates a structured list of all locations within the data
 * @param db a database object
 * @returns the same database object with the filterBounds property filled in
 */
export function calculateBounds(db: DB): DB {
  const allYears = new Set(Object.values(db.Incidents).map((e) => new Date(e.dateString).getFullYear()))
  const minYear = Math.min(...allYears)
  const maxYear = Math.max(...allYears)
  let locations = Object.values(db.Incidents).reduce(
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
  )
  locations = Object.entries(locations).reduce(
    // Sort the departments and municipalities
    (acc, [country, departments]) => {
      acc[country] = Object.fromEntries(Object.entries(departments).sort())
      return acc
    },
    {} as FilterBounds['locations']
  )
  return {
    ...db,
    filterBounds: {
      maxYear,
      minYear,
      locations,
    },
  } as DB
}

export function mergeDBs(db1: DB, db2: DB) {
  return {
    Categories: { ...db1.Categories, ...db2.Categories },
    Types: { ...db1.Types, ...db2.Types },
    Incidents: { ...db1.Incidents, ...db2.Incidents },
  } as DB
}

export function addDocWithTimestamp(ref: CollectionReference, data: any) {
  return addDoc(ref, { ...data, updatedAt: serverTimestamp(), readAt: new Timestamp(0, 0) })
}

export function setDocWithTimestamp(ref: DocumentReference, data: any) {
  return setDoc(ref, { ...data, updatedAt: serverTimestamp() })
}

export function deleteDocWithTimestamp(ref: DocumentReference) {
  return setDoc(ref, { deletedAt: serverTimestamp() }, { merge: true })
}
