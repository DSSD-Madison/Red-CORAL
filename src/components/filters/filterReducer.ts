import { DB, Incident } from "@/types";

export type filterDispatchType = { type: 'ADD_FILTER' | 'REMOVE_FILTER' | 'UPDATE_FILTER'; payload: Partial<filterType> }

export type filterProps = {
  id: number
  data: DB
  dispatch: React.Dispatch<filterDispatchType>
  operation?: (incident: Incident) => boolean
  state?: any
}

export type filterType = {
  id: number
  component: React.FC<filterProps>
  state?: any
  operation?: (incident: Incident) => boolean
}

export type filterState = {
  index: number
  filters: filterType[]
}

/**
 * The idea is that the user can add and layer filters on top of each other to filter the incidents.
 * Each filter has...
 * - an id - a unique identifier for the filter used to remove or update it
 * - a component that is displayed in the filter bar, displays the state of its filter, and can be clicked on to modify or remove the filter.
 * - a state - some filters might need to store some state, maybe.
 * - an operation - a function that takes an incident and returns a boolean. If the incident passes the filter, the function should return true.
 *
 * The filter bar is a horizontal bar that displays all the filters that have been added. It also has a button to add a new filter from a list.
 */
export const filterReducer = (state: filterState, action: filterDispatchType) => {
  let newState = state
  switch (action.type) {
    case 'ADD_FILTER':
      const id = state.index
      const newFilter = { id, ...action.payload } as filterType
      newState = { index: state.index + 1, filters: [...state.filters, newFilter] }
      break
    case 'REMOVE_FILTER':
      newState = { ...state, filters: state.filters.filter((filter) => filter.id !== action.payload.id) }
      break
    case 'UPDATE_FILTER':
      newState = { ...state, filters: state.filters.map((filter) => (filter.id === action.payload.id ? { ...filter, ...action.payload } : filter)) }
      break
  }
  return newState
}
