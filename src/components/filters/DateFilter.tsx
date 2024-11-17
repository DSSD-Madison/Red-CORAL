import { filterProps } from '@/pages/StatsDashboard'
import BaseFilter from './BaseFilter'
import { LucideCalendar, LucideTrash2 } from 'lucide-react'
import { useState } from 'react'
import { formatDateString } from '@/utils'

/**
 * Bare minimum filter component that filters incidents based on them matching a certain date.
 */
const DateFilter = ({ id, data, dispatch }: filterProps) => {
  const [date, setDate] = useState('')
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value)
    dispatch({ type: 'UPDATE_FILTER', payload: { id: id, operation: (incident) => incident.dateString === e.target.value } })
  }
  const removeThisFilter = () => {
    dispatch({ type: 'REMOVE_FILTER', payload: { id: id } })
  }
  console.log('FilterDate rendered') // TODO: Remove this line
  console.log(data) // TODO: Use filterBounds property on data to populate filter
  return (
    <BaseFilter icon={<LucideCalendar />} text={`Fecha: ${formatDateString(date)}`}>
      <button onClick={removeThisFilter} className="absolute right-2 top-1 h-4 w-4 text-red-600" title="Eliminar Filtro">
        <LucideTrash2 size={20} />
      </button>
      <input type="date" onChange={handleChange} value={date} className="rounded-md border border-gray-300 p-1" />
    </BaseFilter>
  )
}

export default DateFilter
