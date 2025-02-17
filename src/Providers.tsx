import { DBProvider } from './context/DBContext'

const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <DBProvider>{children}</DBProvider>
}

export default Providers
