import { useDB } from '@/context/DBContext'
import { DB, Incident } from '@/types'
import { calculateBounds } from '@/utils'
import { useMemo } from 'react'

export function calculateIncidentStats(types: DB['Types'], incidents: [string, Incident][]) {
  const totalincidents = incidents.length

  const countriesSet = new Set<string>()
  const departmentsSet = new Set<string>()
  const municipalitiesSet = new Set<string>()
  const dates: Date[] = []
  const typesSet = new Set<string>()

  incidents.forEach(([_, incident]) => {
    countriesSet.add(incident.country)
    departmentsSet.add(incident.department)
    municipalitiesSet.add(incident.municipality)
    dates.push(new Date(incident.dateString))
    typesSet.add(incident.typeID as string)
  })

  const earliestDate = new Date(Math.min(...dates.map((date) => date.getTime())))
  const latestDate = new Date(Math.max(...dates.map((date) => date.getTime())))

  const categoriesSet = new Set<string>()
  typesSet.forEach((typeID) => {
    const categoryID = types[typeID].categoryID
    categoriesSet.add(categoryID as string)
  })

  return {
    totalincidents,
    countriesCount: countriesSet.size,
    departmentsCount: departmentsSet.size,
    municipalitiesCount: municipalitiesSet.size,
    earliestDate,
    latestDate,
    categoriesCount: categoriesSet.size,
    typesCount: typesSet.size,
  }
}

export default function IncidentsStats({ incidents, bounds }: { incidents: [string, Incident][]; bounds: ReturnType<typeof calculateBounds> }) {
  const { db } = useDB()
  const stats = useMemo(() => calculateIncidentStats(db.Types, incidents), [incidents, db])

  return (
    <div className="relative min-w-max flex-1 rounded-lg bg-neutral-100 p-2">
      <h2>Estadísticas de incidentes</h2>
      <p>
        <span className="font-bold">{bounds.totalCount}</span> incidentes reportados
      </p>
      <hr className="my-2 rounded-full border border-neutral-300" />
      <div className="mt-2 grid grid-cols-2">
        <span>
          <strong>Países:</strong> {Object.keys(bounds.locations).length}
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
