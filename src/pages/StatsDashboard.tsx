// StatsDashboard.tsx
import { DB, Incident } from 'types'
import React, { useMemo, useReducer } from 'react'
import IncidentTable from '@/components/IncidentTable'
import StatisticsFilterBar from '@/components/StatisticsFilterBar'
import { calculateBounds } from '@/utils'
import DummyGraph from '@/components/graphs/DummyGraph'
import { filterReducer } from '../components/filters/filterReducer'

interface StatsDashboardProps {
  data: DB
}

const StatsDashboard: React.FC<StatsDashboardProps> = ({ data }) => {
  const incidents: [string, Incident][] = Object.entries(data.Incidents)
  const [filters, dispatchFilters] = useReducer(filterReducer, { index: 0, filters: [] })
  const filteredIncidents = useMemo(() => {
    return incidents.filter(([, incident]) => filters.filters.every((filter) => (filter.operation ? filter.operation(incident) : true)))
  }, [incidents, filters])
  const filteredBounds = calculateBounds(Object.fromEntries(filteredIncidents))

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold">Estadísticas</h1>
      <StatisticsFilterBar data={data} filters={filters.filters} dispatchFilters={dispatchFilters} />
      <div className="my-4 flex flex-row flex-wrap gap-4">
        <DummyGraph incidents={filteredIncidents} bounds={filteredBounds} />
        <DummyGraph incidents={filteredIncidents} bounds={filteredBounds} />
        <DummyGraph incidents={filteredIncidents} bounds={filteredBounds} />
      </div>
      <IncidentTable data={data} incidents={filteredIncidents} />
    </div>
  )
}

export default StatsDashboard
