import React from 'react'
import { useDB } from '@/context/DBContext'
import { Incident } from 'types'
import { typeIDtoTypeName, typeIDtoCategory } from '@/utils'

type ThingTableProps = {
  mode: 'municipalities' | 'departments' | 'activities' | 'types'
  incidents: [string, Incident][]
}

const modeToTitle = {
  municipalities: 'Municipios',
  departments: 'Departamentos',
  activities: 'Actividades',
  types: 'Tipos',
}

const ThingTable: React.FC<ThingTableProps> = ({ mode, incidents }) => {
  const { db } = useDB()
  const countMap: Record<string, number> = {}

  incidents.forEach(([, incident]) => {
    let key = ''
    if (mode === 'municipalities') {
      key = incident.municipality
    } else if (mode === 'departments') {
      key = incident.department
    } else if (mode === 'activities') {
      key = typeIDtoCategory(db, incident.typeID).name
    } else if (mode === 'types') {
      key = typeIDtoTypeName(db, incident.typeID)
    }
    countMap[key] = (countMap[key] || 0) + 1
  })

  const sortedEntries = Object.entries(countMap).sort((a, b) => b[1] - a[1])

  return (
    <table className="m-2 table-auto">
      <thead>
        <tr>
          <th className="p-2 text-left">{modeToTitle[mode]}</th>
          <th className="p-2 text-left">Cantidad</th>
        </tr>
      </thead>
      <tbody>
        {sortedEntries.map(([thing, count]) => (
          <tr key={thing} className="border-t border-black text-gray-700">
            <td className="p-2">{thing}</td>
            <td className="p-2">{count}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default ThingTable
