import { formatDateString, typeIDtoCategory, typeIDtoTypeName } from '@/utils'
import { Incident } from 'types'
import { Link } from 'react-router'
import { LucideLink } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useDB } from '@/context/DBContext'

const INCIDENT_INCREMENT = 10

const IncidentTable = ({ incidents }: { incidents: [string, Incident][] }) => {
  const { db } = useDB()
  const [visibleCount, setVisibleCount] = useState(10)
  const tableRef = useRef<HTMLTableElement | null>(null)

  useEffect(() => {
    const handleScroll = () => {
      if (tableRef.current && window.innerHeight + window.scrollY >= tableRef.current.offsetHeight) {
        setVisibleCount((prev) => prev + INCIDENT_INCREMENT)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <table ref={tableRef} className="w-full min-w-[600px] table-auto md:min-w-0 md:max-w-full">
      <tbody>
        <tr>
          <th className="pb-2">País</th>
          <th className="w-[5%] pb-2">Tipos de incidentes</th>
          <th className="pb-2">Actividad</th>
          <th className="pb-2">Fecha</th>
          <th className="min-w-[250px] pb-2">Descripción</th>
          <th className="pb-2">Departamento</th>
          <th className="pb-2">Municipio</th>
          <th className="pb-2">Ubicación</th>
        </tr>
        {incidents.slice(0, visibleCount).map(([id, incident]) => (
          <tr key={id} className="text-gray-500">
            <td className="break-words border-t border-black p-2 text-left">{incident.country}</td>
            <td className="break-words border-t border-black p-2 text-left text-sm">{typeIDtoTypeName(db, incident.typeID)}</td>
            <td className="break-words border-t border-black p-2 text-left">{typeIDtoCategory(db, incident.typeID).name}</td>
            <td className="break-words border-t border-black p-2 text-left">{formatDateString(incident.dateString)}</td>
            <td className="break-words border-t border-black p-2 text-left text-sm lg:max-w-[33vw]">{incident.description}</td>
            <td className="break-words border-t border-black p-2 text-left">{incident.department}</td>
            <td className="break-words border-t border-black p-2 text-left">{incident.municipality}</td>
            <td className="break-words border-t border-black p-2 text-left">
              <Link to="/" state={{ coord: incident.location }} className="hover:text-blue-400">
                <LucideLink />
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default IncidentTable
