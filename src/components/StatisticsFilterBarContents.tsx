import React from 'react'
import AddFilter from './filters/AddFilter'
import { filterDispatchType, filterType } from '@/filters/filterReducer'
import { filterComponents } from '@/filters/filterReducer'
import { LucideFilter } from 'lucide-react'

type statsFilterProps = {
  filters: filterType[]
  dispatchFilters: React.Dispatch<filterDispatchType>
}

const StatisticsFilterBarContents = ({ filters, dispatchFilters }: statsFilterProps) => {
  return (
    <>
      <LucideFilter size={16} strokeWidth={1} />
      {filters.map((filter) => {
        const FilterComponent = filterComponents[filter.type]
        if (!FilterComponent) {
          console.error(`No component found for filter type: ${filter.type}`) // This shouldn't happen
          return null
        }
        return <FilterComponent key={filter.id} id={filter.id} dispatch={dispatchFilters} state={filter.state} />
      })}
      <AddFilter dispatch={dispatchFilters} />
    </>
  )
}

export default StatisticsFilterBarContents
