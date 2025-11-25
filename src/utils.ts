import { Category, DB, FilterBounds, Incident, MarkerFilters } from 'types'
import {
  addDoc,
  setDoc,
  serverTimestamp,
  DocumentReference,
  CollectionReference,
  Firestore,
  Timestamp,
  collection,
  getDocs,
  query,
  where,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore/lite'
import { ref, getBytes, FirebaseStorage } from 'firebase/storage'
import { saveToIndexedDB } from './utils/indexedDB'

/**
 * Finds the minimum and maximum years in the data and creates a structured list of all locations within the data
 */
export function calculateBounds(incidents: { [key: string]: Incident }) {
  const allYears = new Set(Object.values(incidents).map((e) => new Date(e.dateString).getFullYear()))
  const minYear = Math.min(...allYears)
  const maxYear = Math.max(...allYears)
  let locations = Object.values(incidents).reduce(
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
  const totalCount = Object.values(incidents).length
  return {
    maxYear,
    minYear,
    locations,
    totalCount
  }
}

export function calculateIncidentStats(types: DB['Types'], incidents: [string, Incident][]) {
  const totalincidents = incidents.length

  const countriesSet = new Set<string>()
  const departmentsSet = new Set<string>()
  const municipalitiesSet = new Set<string>()
  const dates: Date[] = []
  const typesSet = new Set<string>()

  incidents.forEach(([_, incident]) => {
    countriesSet.add(incident.country)
    dates.push(new Date(incident.dateString))
    if (Array.isArray(incident.typeID)) {
      incident.typeID.forEach((typeID) => {
        typesSet.add(typeID)
      })
    } else {
      typesSet.add(incident.typeID)
    }
    // Only add department/municip if it's not Mar Caribe/Océano Pacífico
    if (incident.country === 'Mar Caribe' || incident.country === 'Océano Pacífico') {
      return
    }
    departmentsSet.add(incident.department)
    municipalitiesSet.add(incident.municipality)
  })

  const earliestDate = new Date(Math.min(...dates.map((date) => date.getTime())))
  const latestDate = new Date(Math.max(...dates.map((date) => date.getTime())))

  const categoriesSet = new Set<string>()
  typesSet.forEach((typeID) => {
    const categoryID = types[typeID].categoryID
    categoriesSet.add(categoryID as string)
  })

  return {
    totalincidents,
    countriesCount: countriesSet.size,
    countriesSet,
    departmentsCount: departmentsSet.size,
    departmentsSet,
    municipalitiesCount: municipalitiesSet.size,
    municipalitiesSet,
    earliestDate,
    latestDate,
    categoriesCount: categoriesSet.size,
    typesCount: typesSet.size,
  }
}

export function addDocWithTimestamp(ref: CollectionReference, data: any) {
  return addDoc(ref, { ...data, updatedAt: serverTimestamp() })
}

export function setDocWithTimestamp(ref: DocumentReference, data: any) {
  return setDoc(ref, { ...data, updatedAt: serverTimestamp() })
}

export function deleteDocWithTimestamp(ref: DocumentReference) {
  return setDoc(ref, { updatedAt: serverTimestamp(), deleted: true }, { merge: true })
}

/**
 * Fetches the data from the firebase storage and returns the database object
 * First attempts to retrieve from IndexedDB cache. If cache is not available or 
 * if isAdmin is true, fetches from Firebase.
 * 
 * if isAdmin is set, also queries firestore for documents with updateAt timestamps
 * after the readAt timestamp from firebase storage. Any documents having `deleted: true`
 * will not be returned in the database object.
 */
export async function fetchData(isAdmin: boolean, storage: FirebaseStorage, firestore: Firestore): Promise<DB> {
  // If cache miss or admin mode, fetch from Firebase
  const stateFile = isAdmin ? 'fullState.json' : 'state.json';
  const bytes = await getBytes(ref(storage, stateFile))
  const db: DB = JSON.parse(new TextDecoder().decode(bytes))
  const collectionNames = ['Categories', 'Types', 'Incidents']
  if (isAdmin) {
    const readAtTimestamp = db.readAt ? Timestamp.fromDate(new Date(db.readAt)) : new Timestamp(0, 0)
    const q = where('updatedAt', '>', readAtTimestamp)
    const snaps = await Promise.all(collectionNames.map((col) => getDocs(query(collection(firestore, col), q))))
    for (let i = 0; i < collectionNames.length; i++) {
      const col = collectionNames[i]
      const snap = snaps[i]
      snap.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        //@ts-ignore
        db[col][doc.id] = doc.data()
      })
    }
  }
  for (let col of collectionNames) {
    //@ts-ignore
    for (let key in db[col]) {
      //@ts-ignore
      if (db[col][key].deleted) {
        //@ts-ignore
        delete db[col][key]
      }
    }
  }

  const finalData = {
    ...db,
    filterBounds: calculateBounds(db.Incidents),
    cachedAt: new Date().toISOString(), // Store the last saved timestamp
  };

  // If not in admin mode, save the fetched data to IndexedDB
  if (!isAdmin) {
    await saveToIndexedDB(finalData);
  }

  return finalData;
}

export function filterIncidents(incidents: DB['Incidents'],
  filters: MarkerFilters,
  types: DB['Types'],
  editID: keyof DB['Incidents'] | null): [string, Incident][] {
  return Object.entries(incidents).filter(
    ([id, incident]) =>
      (!filters.startDate || new Date(incident.dateString) >= filters.startDate) &&
      (!filters.endDate || new Date(incident.dateString) <= filters.endDate) &&
      !filters.hideCountries.includes(incident.country) &&
      !filters.hideDepartments.includes(`${incident.country} - ${incident.department}`) &&
      !filters.hideMunicipalities.includes(incident.municipality) &&
      (Array.isArray(incident.typeID)
        ? (incident.typeID.some((typeID) => !filters.hideTypes.includes(typeID)) &&
          incident.typeID.some((typeID) => !filters.hideCategories.includes(types[typeID].categoryID)))
        : (!filters.hideTypes.includes(incident.typeID) &&
          !filters.hideCategories.includes(types[incident.typeID].categoryID))
      ) &&
      (editID == null || id != editID)
  )
}

export function formatDateString(dateString: string): string {
  const date = new Date(dateString)
  if (isNaN(date.getTime())) {
    return 'Fecha inválida'
  }
  return date.toLocaleDateString('es-ES', { timeZone: 'UTC' })
}

export function typeIDtoTypeName(data: DB, typeID: string | string[]): string {
  if (Array.isArray(typeID)) {
    return data.Types[typeID[0]].name
  }
  return data.Types[typeID].name
}

export function typeIDtoCategory(data: DB, typeID: string | string[]): Category {
  if (Array.isArray(typeID)) {
    return data.Categories[data.Types[typeID[0]].categoryID]
  }
  return data.Categories[data.Types[typeID].categoryID];
}

export function typeIDtoCategoryID(data: DB, typeID: string | string[]): keyof DB['Categories'] {
  if (Array.isArray(typeID)) {
    return data.Types[typeID[0]].categoryID
  }
  return data.Types[typeID].categoryID
}

export function typesByCategory(db: DB): { [key: string]: { typeID: string; name: string }[] } {
  return Object.entries(db.Types)
    .sort((a, b) => a[1].name.localeCompare(b[1].name))
    .reduce(
      (acc, [typeID, type]) => {
        if (!acc[type.categoryID]) {
          acc[type.categoryID] = []
        }
        acc[type.categoryID].push({ typeID, name: type.name })
        return acc
      },
      {} as { [key: string]: { typeID: string; name: string }[] }
    )
}

export function formatDuration(duration: number): string {
  // hace 10 horas/hace 2 días/hace 3 semanas/hace 1 mes/hace 1 año
  // biggest unit, round down
  const units = [
    { label: 'año', plural: 'años', value: 1000 * 60 * 60 * 24 * 365 },
    { label: 'mes', plural: 'meses', value: 1000 * 60 * 60 * 24 * 30 },
    { label: 'semana', plural: 'semanas', value: 1000 * 60 * 60 * 24 * 7 },
    { label: 'día', plural: 'días', value: 1000 * 60 * 60 * 24 },
    { label: 'hora', plural: 'horas', value: 1000 * 60 * 60 },
    { label: 'minuto', plural: 'minutos', value: 1000 * 60 },
    { label: 'segundo', plural: 'segundos', value: 1000 },
  ]
  const diffMs = Math.abs(Date.now() - duration)
  for (const unit of units) {
    const diff = diffMs / unit.value
    if (diff >= 1) {
      const count = Math.floor(diff)
      return `hace ${count} ${count > 1 ? unit.plural : unit.label}`
    }
  }
  return 'hace un instante'
}
