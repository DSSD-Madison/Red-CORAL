import { filterType, filterDispatchType } from '@/filters/filterReducer'
import ResetFilters from './filters/ResetFilters'
import StatisticsFilterBarContents from './StatisticsFilterBarContents'
import React from 'react'

type statsFilterProps = {
  filters: filterType[]
  dispatchFilters: React.Dispatch<filterDispatchType>
}

export default function StatisticsFilterBarOuter({ filters, dispatchFilters }: statsFilterProps) {
  return (
    <div className="flex w-full flex-wrap items-center justify-start gap-2 overflow-x-auto rounded-md bg-white px-2 py-2 text-sm shadow">
      <StatisticsFilterBarContents filters={filters} dispatchFilters={dispatchFilters} />
      <div className="flex-grow" />
      <ResetFilters dispatch={dispatchFilters} />
    </div>
  )
}
