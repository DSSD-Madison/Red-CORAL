import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import 'leaflet/dist/leaflet.css'
import { useDB } from './context/DBContext'
import Map from 'pages/Map'
import Login from 'pages/Login'
import AdminCRUD from 'pages/AdminCRUD'
import StatsDashboard from 'pages/StatsDashboard'
import LoadingOverlay from './components/LoadingOverlay'
import Navigation from 'components/Navigation'

const App: React.FC = () => {
  const { isLoggedIn, auth } = useDB()

  function Layout() {
    const { isLoading } = useDB()
    return (
      <div className="relative h-screen max-h-screen pt-5">
        {auth && <Navigation isLoggedIn={isLoggedIn} auth={auth} />}
        <Outlet />
        <LoadingOverlay isVisible={isLoading} color={'#888888'} />
      </div>
    )
  }

  function LoginPage() {
    return isLoggedIn ? <Navigate to="/" /> : <Login auth={auth} />
  }

  function AdminDash() {
    return isLoggedIn ? <AdminCRUD /> : <Login auth={auth} />
  }

  function Analytics() {
    const url = import.meta.env.VITE_ANALYTICS_URL
    return <iframe plausible-embed src={`${url}&embed=true&theme=light`} loading="lazy" className="h-full w-full"></iframe>
  }

  return (
    <>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Layout />}>
            <Route path="/" element={<Map isAdmin={isLoggedIn} />} />
            <Route path="/stats" element={<StatsDashboard />} />
            <Route path="/admin" element={<Navigate to="/login" />} />
            <Route path="/admin/dash" element={<AdminDash />} />
            <Route path="/admin/analytics" element={<Analytics />} />
          </Route>
        </Routes>
      </Router>
    </>
  )
}

export default App
