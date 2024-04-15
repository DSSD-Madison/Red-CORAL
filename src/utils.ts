import { Incident, Category, Type, DB } from 'types'
import { collection, getDocs, Firestore } from 'firebase/firestore'
import { ref, getBytes, FirebaseStorage } from 'firebase/storage'

export async function getDBData(isAdmin: boolean, firestore: Firestore, storage: FirebaseStorage) {
  if (isAdmin) {
    const db: DB = {
      Categories: {},
      Types: {},
      Incidents: {},
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
