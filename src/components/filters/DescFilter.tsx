import { filterProps } from '@/filters/filterReducer'
import BaseFilter from './BaseFilter'
import { LucideText } from 'lucide-react'
import { useState } from 'react'

interface DescFilterState extends filterProps {
  state?: {
    search: string
  }
}
const FilterDesc = ({ id, dispatch, state }: DescFilterState) => {
  const [search, setSearch] = useState(state?.search || '')

  const filterStringDisplay = search ? `: «${search}»` : ''
  return (
    <BaseFilter icon={<LucideText />} text={'Descripción' + filterStringDisplay} dispatch={dispatch} id={id}>
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
        className="rounded bg-blue-500 px-2 py-1 text-white"
      >
        Aplicar
      </button>
    </BaseFilter>
  )
}

export default FilterDesc
