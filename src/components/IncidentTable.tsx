import { formatDateString } from '@/utils'
import { DB, Incident } from 'types'
import { Link } from 'react-router-dom';
import { LucideLink } from 'lucide-react'
const IncidentTable = ({ data, incidents }: { data: DB; incidents: [string, Incident][] }) => {
  return (
    <div className="my-8 w-full overflow-x-auto rounded-lg border border-black p-4 md:w-full">
      <table className="w-full min-w-[800px] table-auto md:min-w-0 md:max-w-full">
        <tbody>
          <tr>
            <th className="break-words pb-2 font-normal">País</th>
            <th className="break-words pb-2 font-normal">Tipo de evento</th>
            <th className="break-words pb-2 font-normal">Actividad</th>
            <th className="break-words pb-2 font-normal">Fecha</th>
            <th className="break-words pb-2 font-normal">Descripción</th>
            <th className="break-words pb-2 font-normal">Departamento</th>
            <th className="break-words pb-2 font-normal">Municipio</th>
            <th className="break-words pb-2 font-normal">Ubicación</th>
          </tr>
          {incidents.map(([id, incident]) => (
            <tr key={id} className="text-gray-500">
              <td className="break-words border-t border-black p-4 text-left">{incident.country}</td>
              <td className="break-words border-t border-black p-4 text-left">{data.Types[incident.typeID].name}</td>
              <td className="break-words border-t border-black p-4 text-left">{data.Categories[data.Types[incident.typeID].categoryID].name}</td>
              <td className="break-words border-t border-black p-4 text-left">{formatDateString(incident.dateString)}</td>
              <td className="max-w-[250px] break-words border-t border-black p-4 text-left lg:max-w-[33vw]">{incident.description}</td>
              <td className="break-words border-t border-black p-4 text-left">{incident.department}</td>
              <td className="break-words border-t border-black p-4 text-left">{incident.municipality}</td>
              <td className="break-words border-t border-black p-4 text-left">
                <Link to="/" state={{ coord: incident.location }} className="hover:text-blue-400">
                  <LucideLink />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default IncidentTable
