import { collection, getDocs, doc, deleteDoc, Firestore, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore/lite'
import { ref, uploadString, getMetadata, FirebaseStorage } from 'firebase/storage'
import { filterOperations, filterType } from '@/filters/filterReducer'
import { DB, Incident, Category, Type } from '@/types' // Import Category and Type

/**
 * Fetches data, applies filters, and uploads to storage.
 */
export async function publishData(firestore: Firestore, storage: FirebaseStorage, filters: filterType[]): Promise<string> {
  const categories: Record<string, Category> = {} // Use Category type
  const types: Record<string, Type> = {} // Use Type type
  const toRemove: { collectionName: string; docId: string }[] = []
  const readAt = new Date().toISOString()

  // Fetch Categories and Types (no filtering needed here)
  for (const d of [
    { target: categories, name: 'Categories' },
    { target: types, name: 'Types' },
  ]) {
    const querySnapshot = await getDocs(collection(firestore, d.name))
    querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
      const data = doc.data()
      if (data.deleted === true) {
        toRemove.push({ collectionName: d.name, docId: doc.id })
      } else {
        delete (data as any).updatedAt // Remove potentially existing but untyped field
        d.target[doc.id] = data as any // Assign fetched data (cast needed if structure differs slightly)
      }
    })
  }

  // Fetch Incidents and apply filters
  const incidentsSnapshot = await getDocs(collection(firestore, 'Incidents'))
  const allIncidents: [string, Incident][] = []
  incidentsSnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
    const data = doc.data()
    if (data.deleted === true) {
      toRemove.push({ collectionName: 'Incidents', docId: doc.id })
    } else {
      delete (data as any).updatedAt // Remove potentially existing but untyped field
      allIncidents.push([doc.id, data as Incident]) // Cast to Incident
    }
  })

  // Prepare the full data object (for adminCheckpointState.json)
  const fullDataOut: Partial<DB> & { readAt: string } = {
    Categories: { ...categories }, // Create copies to avoid mutation issues
    Types: { ...types },
    Incidents: Object.fromEntries(allIncidents),
    readAt: readAt,
  }

  // Minify and upload adminCheckpointState.json to Cloud Storage
  const minifiedFullData = JSON.stringify(fullDataOut)
  const fullStorageRef = ref(storage, 'adminCheckpointState.json')
  await uploadString(fullStorageRef, minifiedFullData, 'raw', {
    contentType: 'application/json',
    contentDisposition: 'attachment; filename="adminCheckpointState.json"',
  })

  // Apply user-defined filters from the UI
  // Construct a temporary DB object for filter operations
  const dbForFiltering: DB = {
    Categories: categories,
    Types: types,
    Incidents: Object.fromEntries(allIncidents),
    filterBounds: {} as any, // filterBounds not used in filtering ops
    readAt: readAt, // readat not used either but trivial to add :)
  }
  const filteredIncidents = allIncidents.filter(
    ([, incident]: [string, Incident]) =>
      filters.every((filter: filterType) => filterOperations[filter.type](incident, filter.state, dbForFiltering) !== false) // thank god this part is easy at least
  )

  // Prepare final output object for state.json (filtered)
  const out: Partial<DB> & { readAt: string } = {
    Categories: categories,
    Types: types,
    Incidents: Object.fromEntries(filteredIncidents),
    readAt: readAt,
  }

  // Minify and upload to Cloud Storage
  const minifiedData = JSON.stringify(out) // Standard JSON.stringify is sufficient
  const storageRef = ref(storage, 'state.json')
  await uploadString(storageRef, minifiedData, 'raw', {
    contentType: 'application/json',
    contentDisposition: 'attachment; filename="state.json"',
  })

  // Remove documents marked as deleted after successful upload
  for (const item of toRemove) {
    try {
      await deleteDoc(doc(firestore, item.collectionName, item.docId))
    } catch (error) {
      console.error(`Failed to delete document ${item.docId} from ${item.collectionName}:`, error)
    }
  }

  return readAt // Return the timestamp of this publish operation
}

/**
 * Fetches the last modified time of the state.json file from storage.
 */
export async function getLastPublishTime(storage: FirebaseStorage): Promise<string | null> {
  try {
    const storageRef = ref(storage, 'state.json')
    const metadata = await getMetadata(storageRef)
    return metadata.updated ?? null
  } catch (error: any) {
    if (error.code === 'storage/object-not-found') {
      console.log('state.json not found, likely first publish.')
      return null
    }
    console.error('Error fetching last publish time:', error)
    return null
  }
}

/**
 * Calculates the number of incidents that *would* be published with the given filters.
 * Does not modify any data.
 */
export async function countIncidentsToPublish(firestore: Firestore, filters: filterType[]): Promise<number> {
  const categories: Record<string, Category> = {}
  const types: Record<string, Type> = {}

  // Fetch Categories and Types for filtering context
  for (const d of [
    { target: categories, name: 'Categories' },
    { target: types, name: 'Types' },
  ]) {
    const querySnapshot = await getDocs(collection(firestore, d.name))
    querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
      const data = doc.data()
      if (data.deleted !== true) {
        d.target[doc.id] = data as any
      }
    })
  }

  // Fetch Incidents
  const incidentsSnapshot = await getDocs(collection(firestore, 'Incidents'))
  const allIncidents: [string, Incident][] = []
  incidentsSnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
    const data = doc.data()
    if (data.deleted !== true) {
      allIncidents.push([doc.id, data as Incident])
    }
  })

  // Apply filters
  // Construct a temporary DB object for filter operations
  const dbForFiltering: DB = {
    Categories: categories, // Use fetched categories
    Types: types, // Use fetched types
    Incidents: Object.fromEntries(allIncidents), // Use fetched incidents
    filterBounds: {} as any, // filterBounds not needed for filtering ops
    // readAt is optional and not needed here
  }

  // Filter the fetched incidents using the provided filters and context
  const filteredIncidents = allIncidents.filter(([, incident]: [string, Incident]) => {
    return filters.every((filter: filterType) => {
      const operation = filterOperations[filter.type]
      // Ensure the operation exists before calling it
      if (operation) {
        return operation(incident, filter.state, dbForFiltering) !== false
      }
      console.warn(`Filter operation not found for type: ${filter.type}`)
      return true // Or false, depending on desired behavior for unknown filters
    })
  })

  return filteredIncidents.length // Return the count of incidents that pass the filters
}
