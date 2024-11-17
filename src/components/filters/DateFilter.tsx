import { filterProps } from '@/pages/StatsDashboard'
import BaseFilter from './BaseFilter'
import { LucideCalendar, LucideChevronDown, LucideChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  useFloating,
  offset,
  flip,
  shift,
  autoUpdate,
  useClick,
  useDismiss,
  useRole,
  useInteractions,
  FloatingFocusManager,
} from '@floating-ui/react'
import { formatDateString } from '@/utils'

enum DateFilterOption {
  IS = 'es',
  IS_BEFORE = 'es anterior',
  IS_AFTER = 'es posterior',
  IS_BETWEEN = 'es entre',
}
const possibleDateFilterOptions: DateFilterOption[] = [
  DateFilterOption.IS,
  DateFilterOption.IS_BEFORE,
  DateFilterOption.IS_AFTER,
  DateFilterOption.IS_BETWEEN,
]

const FilterDate = ({ id, dispatch }: filterProps) => {
  const [date1, setDate1] = useState('')
  const [date2, setDate2] = useState('')
  const [selectedDateFilter, setSelectedDateFilter] = useState(DateFilterOption.IS)
  const [isDateFilterSelectOpen, setIsDateFilterSelectOpen] = useState(false)

  useEffect(() => {
    console.log(date1, date2)

    switch (selectedDateFilter) {
      case DateFilterOption.IS:
        dispatch({ type: 'UPDATE_FILTER', payload: { id: id, operation: (incident) => incident.dateString === date1 } })
        break
      case DateFilterOption.IS_BEFORE:
        dispatch({ type: 'UPDATE_FILTER', payload: { id: id, operation: (incident) => incident.dateString < date1 } })
        break
      case DateFilterOption.IS_AFTER:
        dispatch({ type: 'UPDATE_FILTER', payload: { id: id, operation: (incident) => incident.dateString > date1 } })
        break
      case DateFilterOption.IS_BETWEEN:
        dispatch({
          type: 'UPDATE_FILTER',
          payload: { id: id, operation: (incident) => date1 <= incident.dateString && incident.dateString <= date2 },
        })
        break
    }
  }, [date1, date2, selectedDateFilter])

  //const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //  setDate1(e.target.value)
  //  console.log(e.target.value)
  //
  //  dispatch({ type: 'UPDATE_FILTER', payload: { id: id, operation: (incident) => incident.dateString === e.target.value } })
  //}
  const removeThisFilter = () => {
    dispatch({ type: 'REMOVE_FILTER', payload: { id: id } })
  }

  const { refs, floatingStyles, context } = useFloating({
    open: isDateFilterSelectOpen,
    onOpenChange: setIsDateFilterSelectOpen,
    middleware: [offset(10), flip({ fallbackAxisSideDirection: 'end' }), shift()],
    whileElementsMounted: autoUpdate,
  })

  const click = useClick(context)
  const dismiss = useDismiss(context)
  const role = useRole(context)

  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss, role])

  //console.log('FilterDate rendered')

  return (
    <BaseFilter
      icon={<LucideCalendar />}
      text={
        selectedDateFilter === DateFilterOption.IS_BETWEEN
          ? `Fecha: ${formatDateString(date1)} - ${formatDateString(date2)}`
          : `Fecha: ${formatDateString(date1)}`
      }
    >
      <button onClick={removeThisFilter} className="mb-1 text-red-600">
        Eliminar filtro
      </button>

      {/* Dropdown to select the filter option */}
      <div
        onClick={() => setIsDateFilterSelectOpen(true)}
        className="flex cursor-pointer items-center text-sm"
        ref={refs.setReference}
        {...getReferenceProps()}
      >
        <p className="flex flex-row items-center text-gray-600">
          Fecha {selectedDateFilter}
          <span>{isDateFilterSelectOpen ? <LucideChevronDown size={16} strokeWidth={1} /> : <LucideChevronRight size={16} strokeWidth={1} />}</span>
        </p>

        {isDateFilterSelectOpen && (
          <FloatingFocusManager context={context} modal={false}>
            <div
              ref={refs.setFloating}
              style={floatingStyles}
              className="z-10 min-w-48 rounded-md border border-gray-300 bg-white px-1 py-2 focus-visible:outline-none"
              {...getFloatingProps()}
            >
              <h2 className="p-1 text-sm font-semibold">Opción de filtro</h2>
              {possibleDateFilterOptions.map((dateFilterOption) => (
                <button
                  key={dateFilterOption}
                  className="flex w-full items-center gap-2 rounded-md p-1 hover:bg-black/5"
                  onClick={() => setSelectedDateFilter(dateFilterOption)}
                >
                  <span>{dateFilterOption}</span>
                </button>
              ))}
            </div>
          </FloatingFocusManager>
        )}
      </div>

      <div className="flex flex-row items-center gap-2">
        {/* First input to select the first date */}
        <input type="date" onChange={(e) => setDate1(e.target.value)} value={date1} className="rounded-md border border-gray-300 p-1" />

        {/* Second input to select the second date (only used for the "between" filter) */}
        {selectedDateFilter === DateFilterOption.IS_BETWEEN && (
          <>
            <span>-</span>
            <input type="date" onChange={(e) => setDate2(e.target.value)} value={date2} className="rounded-md border border-gray-300 p-1" />
          </>
        )}
      </div>
    </BaseFilter>
  )
}

export default FilterDate
