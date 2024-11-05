// StatsDashboard.tsx
import { Incident, DB } from 'types';
import React from 'react';


interface StatsDashboardProps {
  data: DB
  /*incidentID: keyof DB['Incidents'] | null*/
}

const StatsDashboard: React.FC<StatsDashboardProps> = ({data}) => {
  const incidents = data.Incidents

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold">Statistics Dashboard</h1>
      <p>This page is currently under development. Statistics will be available here soon.</p>
      <br></br>
      <div className="m-8 p-4 overflow-hidden border border-black rounded-lg">
      <table className="table-fixed w-full ">
                <tr> 
                    <th className="font-normal pb-2 break-words ">País</th>
                    <th className="font-normal pb-2 break-words">Tipo de evento</th>
                    <th className="font-normal pb-2 break-words ">Actividad</th>
                    <th className="font-normal pb-2 break-words ">Fecha</th>
                    <th className="font-normal pb-2 break-words ">Descripción</th>
                    <th className="font-normal pb-2 break-words ">Departamento</th>
                    <th className="font-normal pb-2 break-words ">Municipio</th>
                </tr>
          
               
                
                      {Object.entries(incidents).map(([id, incident]) => (
                        <tr key={id} className="text-gray-500">
          
                          <td className="p-4 text-left break-words border-t border-black">
                           {incident.country}
                          </td>
                          <td className="p-4 text-left break-words border-t border-black">{data.Types[incident.typeID].name}</td>
                          <td className="p-4 text-left break-words border-t border-black">{data.Categories[data.Types[incident.typeID].categoryID].name}</td>
                          <td className="p-4 text-left break-words border-t border-black">{incident.dateString}</td>
                          <td className="p-4 text-left break-words border-t border-black">{incident.description}</td>
                          <td className="p-4 text-left break-words border-t border-black">{incident.department}</td>
                          <td className="p-4 text-left break-words border-t border-black">{incident.municipality}</td>
                        </tr>
                      ))}
                    
            </table>
            </div>
    
    </div>
  );
};

export default StatsDashboard;

