import React, { useEffect, useReducer } from 'react'
import { filterProps, filterReducer, filterType } from './filterReducer'
import BaseFilter from './BaseFilter'
import { LucideMerge, LucideTrash2 } from 'lucide-react'
import { Incident } from '@/types'
import AddFilter from './AddFilter'

/**
 * Represents a filter that itself contains filters.
 * It manipulates the operations of the filters it contains using an OR operation, and
 * passes that operation to the parent dispatcher.
 */
const BoolORFilter: React.FC<filterProps> = ({ id, data, dispatch }) => {
  const [internalFilters, dispatchInternalFilters] = useReducer(filterReducer, { index: 0, filters: [] })
  const updateParent = (state: { filters: filterType[] }) => {
    let orOperation = (incident: Incident) => state.filters.some((filter) => (filter.operation ? filter.operation(incident) : false))
    if (state.filters.length === 0) {
      orOperation = () => true
    }

    dispatch({
      type: 'UPDATE_FILTER',
      payload: {
        id: id,
        operation: orOperation,
      },
    })
  }
  const removeThisFilter = () => {
    dispatch({ type: 'REMOVE_FILTER', payload: { id } })
  }
  useEffect(() => {
    updateParent(internalFilters)
  }, [internalFilters])

  return (
    <BaseFilter icon={<LucideMerge />} text={`O (${internalFilters.filters.length} filtros)`}>
      <button onClick={removeThisFilter} className="absolute right-2 top-1 h-4 w-4 text-red-600" title="Eliminar Filtro">
        <LucideTrash2 size={20} />
      </button>
      <br />
      <div className="flex max-w-[50vw] flex-wrap gap-2 px-2">
        {internalFilters.filters.map((filter) => {
          const FilterComponent = filter.component
          return (
            <FilterComponent
              key={filter.id}
              id={filter.id}
              data={data}
              dispatch={dispatchInternalFilters}
              operation={filter.operation}
              state={filter.state}
            />
          )
        })}
        <AddFilter dispatch={dispatchInternalFilters} />
      </div>
    </BaseFilter>
  )
}

export default BoolORFilter