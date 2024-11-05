// StatsDashboard.tsx
import { DB } from 'types'
import React from 'react'

interface StatsDashboardProps {
  data: DB
}

const StatsDashboard: React.FC<StatsDashboardProps> = ({ data }) => {
  const incidents = data.Incidents

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold">Statistics Dashboard</h1>
      <p>This page is currently under development. Statistics will be available here soon.</p>
      <br></br>
      <div className="m-8 overflow-hidden rounded-lg border border-black p-4">
        <table className="w-full table-fixed">
          <tr>
            <th className="break-words pb-2 font-normal">País</th>
            <th className="break-words pb-2 font-normal">Tipo de evento</th>
            <th className="break-words pb-2 font-normal">Actividad</th>
            <th className="break-words pb-2 font-normal">Fecha</th>
            <th className="break-words pb-2 font-normal">Descripción</th>
            <th className="break-words pb-2 font-normal">Departamento</th>
            <th className="break-words pb-2 font-normal">Municipio</th>
          </tr>

          {Object.entries(incidents).map(([id, incident]) => (
            <tr key={id} className="text-gray-500">
              <td className="break-words border-t border-black p-4 text-left">{incident.country}</td>
              <td className="break-words border-t border-black p-4 text-left">{data.Types[incident.typeID].name}</td>
              <td className="break-words border-t border-black p-4 text-left">{data.Categories[data.Types[incident.typeID].categoryID].name}</td>
              <td className="break-words border-t border-black p-4 text-left">{incident.dateString}</td>
              <td className="break-words border-t border-black p-4 text-left">{incident.description}</td>
              <td className="break-words border-t border-black p-4 text-left">{incident.department}</td>
              <td className="break-words border-t border-black p-4 text-left">{incident.municipality}</td>
            </tr>
          ))}
        </table>
      </div>
    </div>
  )
}

export default StatsDashboard
