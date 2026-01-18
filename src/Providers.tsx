import { DBProvider } from './context/DBContext'
import React from 'react'

const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <DBProvider>{children}</DBProvider>
}

export default Providers
