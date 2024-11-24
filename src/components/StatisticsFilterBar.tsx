import { DB } from '@/types'
import React from 'react'
import AddFilter from './filters/AddFilter'
import { filterType, filterDispatchType } from './filters/filterReducer'

type statsFilterProps = {
  data: DB
  filters: filterType[]
  dispatchFilters: React.Dispatch<filterDispatchType>
}

const StatisticsFilterBar = ({ data, filters, dispatchFilters }: statsFilterProps) => {
  return (
    <div className="flex h-8 items-center justify-start gap-2 border-b border-t border-gray-400 text-sm">
      {filters.map((filter) => {
        const FilterComponent = filter.component
        return (
          <FilterComponent key={filter.id} id={filter.id} data={data} dispatch={dispatchFilters} operation={filter.operation} state={filter.state} />
        )
      })}
      <AddFilter dispatch={dispatchFilters} />
    </div>
  )
}

export default StatisticsFilterBar
