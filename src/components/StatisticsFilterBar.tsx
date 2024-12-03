import { DB } from '@/types'
import React from 'react'
import AddFilter from './filters/AddFilter'
import { filterDispatchType, filterType } from '@/pages/StatsDashboard'

type statsFilterProps = {
  data: DB
  filters: filterType[]
  dispatchFilters: React.Dispatch<filterDispatchType>
}

const StatisticsFilterBar = ({ data, filters, dispatchFilters }: statsFilterProps) => {
  return (
    <div className="overflow-x-auto border-b border-t border-gray-400 text-sm">
      <div className="flex h-8 w-max items-center justify-start gap-2">
        {filters.map((filter) => {
          const FilterComponent = filter.component
          return (
            <FilterComponent
              key={filter.id}
              id={filter.id}
              data={data}
              dispatch={dispatchFilters}
              operation={filter.operation}
              state={filter.state}
            />
          )
        })}
        <AddFilter dispatch={dispatchFilters} />
      </div>
    </div>
  )
}

export default StatisticsFilterBar
