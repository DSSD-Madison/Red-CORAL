import type { Auth } from 'firebase/auth'
import type { Firestore } from 'firebase/firestore'
import type { FirebaseStorage } from 'firebase/storage'
import * as React from 'react'

type FirebaseContext = {
  auth: Auth
  firestore: Firestore
  storage: FirebaseStorage
}

export const FirebaseContext = React.createContext<FirebaseContext | null>(null)
