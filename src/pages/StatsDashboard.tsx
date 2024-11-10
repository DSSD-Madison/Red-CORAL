// StatsDashboard.tsx
import { DB, Incident } from 'types'
import React from 'react'
import IncidentTable from '@/components/IncidentTable'

interface StatsDashboardProps {
  data: DB
}

const StatsDashboard: React.FC<StatsDashboardProps> = ({ data }) => {
  const incidents: [string, Incident][] = Object.entries(data.Incidents)

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold">Estadísticas</h1>
      <IncidentTable data={data} incidents={incidents} />
    </div>
  )
}

export default StatsDashboard
