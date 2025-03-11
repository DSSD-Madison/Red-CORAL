import { filterProps } from '@/filters/filterReducer'
import BaseFilter from './BaseFilter'
import { LucideText, LucideTrash2 } from 'lucide-react'
import { useState } from 'react'

interface DescFilterState extends filterProps {
  state?: {
    search: string
  }
}
const FilterDesc = ({ id, dispatch, state }: DescFilterState) => {
  const [search, setSearch] = useState(state?.search || '')

  const removeThisFilter = () => {
    dispatch({ type: 'REMOVE_FILTER', payload: { id: id } })
  }
  const filterStringDisplay = search ? `: «${search}»` : ''
  return (
    <BaseFilter icon={<LucideText />} text={'Descripción' + filterStringDisplay}>
      <button onClick={removeThisFilter} className="absolute right-2 top-1 h-4 w-4 text-red-600" title="Eliminar Filtro">
        <LucideTrash2 size={20} />
      </button>
      <input type="text" onChange={(e) => setSearch(e.target.value)} value={search} className="mr-6 rounded-md border border-gray-300 p-1" />
      <button
        onClick={() =>
          dispatch({
            type: 'UPDATE_FILTER',
            payload: {
              id: id,
              state: { search: search },
            },
          })
        }
        className="mt-4 rounded bg-blue-500 px-2 py-1 text-white"
      >
        Aplicar
      </button>
    </BaseFilter>
  )
}

export default FilterDesc
