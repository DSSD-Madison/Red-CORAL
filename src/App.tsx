import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router'
import 'leaflet/dist/leaflet.css'
import { useDB } from './context/DBContext'
import Map from 'pages/Map'
import Login from 'pages/Login'
import About from 'pages/About'
import Navigation from 'components/Navigation'
import DBLoadingOverlay from './components/DBLoadingOverlay'

const AdminCRUD = lazy(() => import('@/pages/AdminCRUD'))
const StatsDashboard = lazy(() => import('@/pages/StatsDashboard'))
const PublishAdmin = lazy(() => import('@/pages/PublishAdmin'))

function Layout() {
  return (
    <div className="relative h-screen max-h-screen pt-5">
      <Navigation />
      <Outlet />
      <DBLoadingOverlay />
    </div>
  )
}

const App: React.FC = () => {
  const { isLoggedIn, auth } = useDB()

  function LoginPage() {
    return isLoggedIn ? <Navigate to="/" /> : <Login auth={auth} />
  }

  function AdminDash() {
    return isLoggedIn ? (
      <Suspense fallback={<div className="flex min-h-full flex-col gap-2 bg-white p-4">Loading...</div>}>
        <AdminCRUD />
      </Suspense>
    ) : (
      <Login auth={auth} />
    )
  }

  function AdminAnalytics() {
    const url = import.meta.env.VITE_ANALYTICS_URL
    return isLoggedIn ? (
      <iframe plausible-embed src={`${url}&embed=true&theme=light`} loading="lazy" className="h-full w-full"></iframe>
    ) : (
      <Login auth={auth} />
    )
  }

  function AdminAbout() {
    return isLoggedIn ? <About /> : <Login auth={auth} />
  }

  function StatsPage() {
    return (
      <Suspense fallback={<div className="flex min-h-full flex-col gap-2 bg-slate-200 p-4">Loading...</div>}>
        <StatsDashboard />
      </Suspense>
    )
  }

  function AdminPublish() {
    return isLoggedIn ? (
      <Suspense fallback={<div className="flex min-h-full flex-col gap-2 bg-slate-200 p-4">Loading...</div>}>
        <PublishAdmin />
      </Suspense>
    ) : (
      <Login auth={auth} />
    )
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Layout />}>
          <Route path="/" element={<Map />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/about" element={<AdminAbout />} />
          <Route path="/admin" element={<Navigate to="/login" />} />
          <Route path="/admin/dash" element={<AdminDash />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
          <Route path="/admin/publish" element={<AdminPublish />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
