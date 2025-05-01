// StatsDashboard.tsx
import { Incident } from 'types'
import React, { useEffect, useMemo, useReducer, useState } from 'react'
import IncidentTable from '@/components/IncidentTable'
import ThingTable from '@/components/ThingTable' // <-- new import
import StatisticsFilterBar from '@/components/StatisticsFilterBar'
import { calculateBounds } from '@/utils'
import IncidentsStats from '@/components/graphs/IncidentsStats'
import LineGraph from '@/components/graphs/LineGraph'
import PieChart from '@/components/graphs/PieChart'
import StatisticsFilterMap from '@/components/StatisticsFilterMap'
import { useDB } from '@/context/DBContext'
import { filterOperations, filterReducer, initialFilterState } from '@/filters/filterReducer'

const ViewButton: React.FC<any> = ({ currentView, setCurrentView, view, label }) => {
  return (
    <button
      onClick={() => setCurrentView(view)}
      className={`rounded-full border px-3 transition-all hover:shadow-md ${currentView === view ? 'border-blue-600 bg-blue-100 text-blue-600 shadow-md' : 'border-gray-300 hover:bg-gray-100'}`}
    >
      {label}
    </button>
  )
}

function getFilterState() {
  try {
    const local = localStorage.getItem('filterState')
    if (local) {
      return JSON.parse(local)
    }
  } catch (e) {
    console.error(e)
    localStorage.removeItem('filterState')
  }
  return initialFilterState(0)
}

const StatsDashboard: React.FC = () => {
  const { db } = useDB()
  const [filters, dispatchFilters] = useReducer(filterReducer, getFilterState())

  // save filter state to local storage
  useEffect(() => {
    localStorage.setItem('filterState', JSON.stringify(filters))
  }, [filters])

  const [currentView, setCurrentView] = useState<'incidents' | 'municipalities' | 'departments' | 'activities' | 'types' | 'map'>('incidents')
  const incidents: [string, Incident][] = Object.entries(db.Incidents)
  const sortedIncidents = useMemo(
    () =>
      incidents.sort(
        ([, a], [, b]) => a.dateString.localeCompare(b.dateString) || a.location.lat - b.location.lat || a.location.lng - b.location.lng
      ),
    [incidents]
  )
  const filteredIncidents = useMemo(
    () =>
      sortedIncidents.filter(([, incident]) =>
        filters.filters.every((filter) => filterOperations[filter.type](incident, filter.state, db) !== false)
      ),
    [sortedIncidents, filters]
  )
  const filteredBounds = calculateBounds(Object.fromEntries(filteredIncidents))

  return (
    <div className="flex min-h-full flex-col gap-2 bg-slate-200 p-4">
      <div className="flex flex-row items-start gap-2">
        <h1 className="text-2xl font-semibold">Estadísticas</h1>
        <div className="flex-grow" />
        <img src="banner.png" alt="Red CORAL logo" className="w-full max-w-64" />
      </div>
      <StatisticsFilterBar filters={filters.filters} dispatchFilters={dispatchFilters} />
      <div className="flex w-full flex-wrap justify-center gap-2">
        <PieChart incidents={filteredIncidents}></PieChart>
        <LineGraph incidents={filteredIncidents} bounds={filteredBounds} />
        <IncidentsStats incidents={filteredIncidents} bounds={filteredBounds} />
      </div>
      <div className="w-full grow overflow-x-auto rounded-lg bg-white shadow md:w-full">
        <div className="m-2 flex flex-wrap items-center gap-2">
          <ViewButton currentView={currentView} setCurrentView={setCurrentView} view="incidents" label="Incidentes" />
          <ViewButton currentView={currentView} setCurrentView={setCurrentView} view="municipalities" label="Municipios" />
          <ViewButton currentView={currentView} setCurrentView={setCurrentView} view="departments" label="Departamentos" />
          <ViewButton currentView={currentView} setCurrentView={setCurrentView} view="activities" label="Actividades" />
          <ViewButton currentView={currentView} setCurrentView={setCurrentView} view="types" label="Tipos" />
          <ViewButton currentView={currentView} setCurrentView={setCurrentView} view="map" label="Mapa" />
        </div>
        <div className="mb-2 border-b border-gray-300"></div>
        <div className="max-w-full overflow-x-auto p-2">
          {currentView === 'incidents' ? (
            <IncidentTable incidents={filteredIncidents} />
          ) : currentView === 'map' ? (
            <StatisticsFilterMap incidents={filteredIncidents} />
          ) : (
            <ThingTable mode={currentView} incidents={filteredIncidents} />
          )}
        </div>
      </div>
    </div>
  )
}

export default StatsDashboard
