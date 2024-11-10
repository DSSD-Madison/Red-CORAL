import { filterProps } from '@/pages/StatsDashboard'
import BaseFilter from './BaseFilter'
import { LucideCalendar } from 'lucide-react'
import { useState } from 'react'
import { formatDateString } from '@/utils'

const FilterDate = ({ id, dispatch }: filterProps) => {
  const [date, setDate] = useState('')
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value)
    dispatch({ type: 'UPDATE_FILTER', payload: { id: id, operation: (incident) => incident.dateString === e.target.value } })
  }
  const removeThisFilter = () => {
    dispatch({ type: 'REMOVE_FILTER', payload: { id: id } })
  }
  console.log('FilterDate rendered')
  return (
    <BaseFilter icon={<LucideCalendar />} text={`Fecha: ${formatDateString(date)}`}>
      <button onClick={removeThisFilter} className="text-red-600">
        Eliminar filtro
      </button>
      <br />
      <input type="date" onChange={handleChange} value={date} className="rounded-md border border-gray-300 p-1" />
    </BaseFilter>
  )
}

export default FilterDate
