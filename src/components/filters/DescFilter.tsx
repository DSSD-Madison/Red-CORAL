import { filterProps } from '@/pages/StatsDashboard'
import BaseFilter from './BaseFilter'
import { LucideCalendar, LucideTrash2 } from 'lucide-react'
import { useState, useEffect } from 'react'

const FilterDesc = ({ id, dispatch }: filterProps) => {
  const [search, setSearch] = useState('')

  useEffect(() => {
    const lowercaseSearch = search.toLowerCase()
    dispatch({
      type: 'UPDATE_FILTER',
      payload: {
        id: id,
        operation: (incident) => incident.description.toLowerCase().includes(lowercaseSearch),
      },
    })
  }, [search])

  const removeThisFilter = () => {
    dispatch({ type: 'REMOVE_FILTER', payload: { id: id } })
  }

  return (
    <BaseFilter icon={<LucideCalendar />} text={`La descripción contiene «${search}»`}>
      <button onClick={removeThisFilter} className="absolute right-2 top-1 h-4 w-4 text-red-600" title="Eliminar Filtro">
        <LucideTrash2 size={20} />
      </button>
      <input type="text" onChange={(e) => setSearch(e.target.value)} value={search} className="mr-6 rounded-md border border-gray-300 p-1" />
    </BaseFilter>
  )
}

export default FilterDesc
