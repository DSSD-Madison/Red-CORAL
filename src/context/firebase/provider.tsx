import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

import { FirebaseContext } from './context'

export default function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const app = initializeApp({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  })

  const auth = getAuth(app)
  const firestore = getFirestore(app)
  const storage = getStorage(app, import.meta.env.VITE_FIREBASE_STORAGE_BUCKET)

  return <FirebaseContext.Provider value={{ auth, firestore, storage }}>{children}</FirebaseContext.Provider>
}
