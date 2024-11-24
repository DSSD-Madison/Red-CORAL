import React, { useEffect, useReducer } from 'react'
import { filterProps, filterReducer, filterType } from './filterReducer'
import BaseFilter from './BaseFilter'
import { LucideMerge, LucideTrash2 } from 'lucide-react'
import { Incident } from '@/types'
import AddFilter from './AddFilter'

/**
 * Represents a filter that itself contains filters.
 * It manipulates the operations of the filters it contains using a NOT operation, and
 * passes that operation to the parent dispatcher.
 */
const BoolNOTFilter: React.FC<filterProps> = ({ id, data, dispatch }) => {
  const [internalFilters, dispatchInternalFilters] = useReducer(filterReducer, { index: 0, filters: [] })
  const updateParent = (state: { filters: filterType[] }) => {
    let notOperation = (incident: Incident) => state.filters.every((filter) => (filter.operation ? !filter.operation(incident) : true))
    if (state.filters.length === 0) {
      notOperation = () => true
    }

    dispatch({
      type: 'UPDATE_FILTER',
      payload: {
        id: id,
        operation: notOperation,
      },
    })
  }
  useEffect(() => {
    updateParent(internalFilters)
  }, [internalFilters])
  const removeThisFilter = () => {
    dispatch({ type: 'REMOVE_FILTER', payload: { id } })
  }

  return (
    <BaseFilter icon={<LucideMerge />} text={`NO (${internalFilters.filters.length} filtros)`}>
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

export default BoolNOTFilter
