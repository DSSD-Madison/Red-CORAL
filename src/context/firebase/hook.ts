import * as React from 'react'

import { FirebaseContext } from './context'

export default function useFirebase() {
  const context = React.useContext(FirebaseContext)
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider')
  }
  return context
}
