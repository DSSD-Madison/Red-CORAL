import { useDB } from '@/context/DBContext'
import { Incident } from '@/types'
import { calculateBounds, calculateIncidentStats } from '@/utils'
import { useMemo } from 'react'

export default function IncidentsStats({ incidents, bounds }: { incidents: [string, Incident][]; bounds: ReturnType<typeof calculateBounds> }) {
  const { db } = useDB()
  const stats = useMemo(() => calculateIncidentStats(db.Types, incidents), [incidents, db])
  // subtract maritime areas if they're in the set of countries
  stats.countriesSet.delete('Mar Caribe')
  stats.countriesSet.delete('Océano Pacífico')
  return (
    <div className="relative min-w-max flex-1 rounded-lg bg-neutral-100 p-2">
      <h2>Estadísticas de incidentes</h2>
      <p>
        <span className="font-bold">{bounds.totalCount}</span> incidentes reportados
      </p>
      <hr className="my-2 rounded-full border border-neutral-300" />
      <div className="mt-2 grid grid-cols-2">
        <span>
          {/* we don't want to count the two maritime areas. what's the easiest way to do that? */}
          <strong>Países:</strong> {stats.countriesSet.size}
        </span>
        <span>
          <strong>Departamentos:</strong> {Object.values(bounds.locations).reduce((acc, departments) => acc + Object.keys(departments).length, 0)}
        </span>
        <span>
          <strong>Municipios:</strong>{' '}
          {Object.values(bounds.locations).reduce(
            (acc, departments) => acc + Object.values(departments).reduce((acc, municipalities) => acc + municipalities.length, 0),
            0
          )}
        </span>
      </div>
      <hr className="my-2 rounded-full border border-neutral-300" />
      <div className="mt-2 grid grid-cols-2">
        <span>
          <strong>Desde:</strong> {stats.earliestDate.toLocaleDateString('es-ES', { timeZone: 'UTC' })}
        </span>
        <span>
          <strong>Hasta:</strong> {stats.latestDate.toLocaleDateString('es-ES', { timeZone: 'UTC' })}
        </span>
      </div>
      <hr className="my-2 rounded-full border border-neutral-300" />
      <div className="grid grid-cols-2">
        <span>
          <strong>Actividades:</strong> {stats.categoriesCount}
        </span>
        <span>
          <strong>Tipos:</strong> {stats.typesCount}
        </span>
      </div>
    </div>
  )
}
