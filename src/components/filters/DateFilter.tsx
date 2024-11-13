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
  IS_BEFORE = 'es antes',
  IS_AFTER = 'es despues',
  IS_BETWEEN = 'está entre',
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
        dispatch({ type: 'UPDATE_FILTER', payload: { id: id, operation: (incident) => incident.dateString > date1 && incident.dateString < date2 } })
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

  console.log('FilterDate rendered')
  return (
    <BaseFilter icon={<LucideCalendar />} text={`Fecha: ${formatDateString(date1)}`}>
      <div>
        <button onClick={removeThisFilter} className="text-red-600">
          Eliminar filtro
        </button>

        {/* Dropdown to select the filter option */}
        <div
          onClick={() => setIsDateFilterSelectOpen(true)}
          className="flex cursor-pointer items-center text-sm"
          ref={refs.setReference}
          {...getReferenceProps()}
        >
          {isDateFilterSelectOpen ? <LucideChevronDown size={16} strokeWidth={1} /> : <LucideChevronRight size={16} strokeWidth={1} />}
          <span className="text-gray-600">{selectedDateFilter}</span>
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
      </div>

      {/* Input to select the date */}
      <input type="date" onChange={(e) => setDate1(e.target.value)} value={date1} className="rounded-md border border-gray-300 p-1" />

      {/* TODO: Second date input for "between" filter */}
    </BaseFilter>
  )
}

export default FilterDate
