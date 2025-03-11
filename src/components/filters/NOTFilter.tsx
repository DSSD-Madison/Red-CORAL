import { filterProps, filterType, filterComponents, filterDispatchType } from '@/filters/filterReducer'
import BaseFilter from './BaseFilter'
import { CircleOff } from 'lucide-react'
import AddFilter from './AddFilter'

export interface NOTFilterState extends filterProps {
  state?: {
    index: number
    filters: filterType[]
  }
}

/**
 * NOTFilter contains filters inside it. Those filters are negated.
 */
const NOTFilter = ({ id, dispatch, state }: NOTFilterState) => {
  const eState = state || { index: 0, filters: [] } // effective state
  const intermediateDispatch = (action: filterDispatchType) => {
    switch (action.type) {
      case 'REMOVE_FILTER':
        dispatch({
          type: 'UPDATE_FILTER',
          payload: { id, state: { ...eState, filters: eState.filters.filter((filter) => filter.id !== action.payload.id) } },
        })
        break
      case 'UPDATE_FILTER':
        const newState = {
          ...eState,
          filters: eState.filters.map((filter) => (filter.id === action.payload.id ? { ...filter, ...action.payload } : filter)),
        }
        dispatch({ type: 'UPDATE_FILTER', payload: { id, state: newState } })
        break
      case 'ADD_FILTER':
        const newId = eState.index
        const newFilter = { id: newId, ...action.payload } as filterType
        dispatch({
          type: 'UPDATE_FILTER',
          payload: { id, state: { index: newId + 1, filters: [...eState.filters, newFilter] } },
        })
        break
    }
  }

  return (
    <BaseFilter
      icon={<CircleOff />}
      text={
        eState.filters.length === 0
          ? 'NO'
          : eState.filters.length === 1
            ? 'NO: ' + eState.filters.length + ' filtro'
            : 'NO: ' + eState.filters.length + ' filtros'
      }
      dispatch={dispatch}
      id={id}
    >
      <div className="mx-2 mt-2 flex w-max max-w-full flex-wrap items-center justify-start gap-2">
        {eState.filters.map((filter) => {
          const FilterComponent = filterComponents[filter.type]
          if (!FilterComponent) {
            console.error(`No component found for filter type: ${filter.type}`) // This shouldn't happen
            return null
          }
          return <FilterComponent key={filter.id} id={filter.id} dispatch={intermediateDispatch} state={filter.state} />
        })}
        <AddFilter dispatch={intermediateDispatch} />
      </div>
    </BaseFilter>
  )
}

export default NOTFilter
