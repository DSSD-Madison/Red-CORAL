import React from 'react'
import AddFilter from './filters/AddFilter'
import { filterDispatchType, filterType } from '@/filters/filterReducer'
import { filterComponents } from '@/filters/filterReducer'
import ResetFilters from './filters/ResetFilters'

type statsFilterProps = {
  filters: filterType[]
  dispatchFilters: React.Dispatch<filterDispatchType>
}

const StatisticsFilterBar = ({ filters, dispatchFilters }: statsFilterProps) => {
  return (
    <div className="overflow-x-auto border-b border-t border-gray-400 py-2 text-sm">
      <div className="flex w-full flex-wrap items-center justify-start gap-2">
        {filters.map((filter) => {
          const FilterComponent = filterComponents[filter.type]
          if (!FilterComponent) {
            console.error(`No component found for filter type: ${filter.type}`) // This shouldn't happen
            return null
          }
          return <FilterComponent key={filter.id} id={filter.id} dispatch={dispatchFilters} state={filter.state} />
        })}
        <AddFilter dispatch={dispatchFilters} />
        <div className="flex-grow" />
        <ResetFilters dispatch={dispatchFilters} />
      </div>
    </div>
  )
}

export default StatisticsFilterBar
