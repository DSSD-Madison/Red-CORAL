// StatsDashboard.tsx
import { Incident } from 'types'
import React, { useMemo, useReducer, useState } from 'react'
import IncidentTable from '@/components/IncidentTable'
import StatisticsFilterBar from '@/components/StatisticsFilterBar'
import { calculateBounds } from '@/utils'
import IncidentsStats from '@/components/graphs/IncidentsStats'
import LineGraph from '@/components/graphs/LineGraph'
import PieChart from '@/components/graphs/PieChart'
import StatisticsFilterMap from '@/components/StatisticsFilterMap'
import { LucideMap } from 'lucide-react'
import { useDB } from '@/context/DBContext'
import { filterOperations, filterReducer, initialFilterState } from '@/filters/filterReducer'

const StatsDashboard: React.FC = () => {
  const { db } = useDB()
  const [isShowingMap, setIsShowingMap] = useState(false)
  const [filters, dispatchFilters] = useReducer(filterReducer, initialFilterState)
  const incidents: [string, Incident][] = Object.entries(db.Incidents)
  const sortedIncidents = useMemo(
    () =>
      incidents.sort(
        ([, a], [, b]) => a.dateString.localeCompare(b.dateString) || a.location.lat - b.location.lat || a.location.lng - b.location.lng
      ),
    [incidents]
  )
  const filteredIncidents = useMemo(
    () => sortedIncidents.filter(([, incident]) => filters.filters.every((filter) => filterOperations[filter.type](incident, filter.state, db))),
    [sortedIncidents, filters]
  )
  const filteredBounds = calculateBounds(Object.fromEntries(filteredIncidents))

  return (
    <div className="h-full p-4">
      <div className="flow-row flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Estadísticas</h1>
        <button
          className="m-1 flex items-center rounded-md px-2 py-1 hover:bg-black hover:bg-opacity-10"
          onClick={() => setIsShowingMap(!isShowingMap)}
        >
          <LucideMap size={20} className="mr-1" />
          {isShowingMap ? 'Ocultar Mapa' : 'Mostrar Mapa'}
        </button>
      </div>
      <StatisticsFilterBar filters={filters.filters} dispatchFilters={dispatchFilters} />
      {isShowingMap ? (
        <StatisticsFilterMap incidents={filteredIncidents} />
      ) : (
        <>
          <div className="mx-auto my-4 grid max-w-[500px] gap-4 lg:max-w-full lg:grid-cols-3">
            <PieChart incidents={filteredIncidents}></PieChart>
            <LineGraph incidents={filteredIncidents} bounds={filteredBounds} />
            <IncidentsStats incidents={filteredIncidents} bounds={filteredBounds} />
          </div>
          <IncidentTable incidents={filteredIncidents} />
        </>
      )}
    </div>
  )
}

export default StatsDashboard
