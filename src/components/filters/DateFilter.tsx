import { filterProps } from '@/filters/filterReducer'
import BaseFilter from './BaseFilter'
import { LucideCalendar, LucideChevronDown, LucideChevronRight, LucideTrash2 } from 'lucide-react'
import { useState } from 'react'
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
  YEARS = 'años',
}

const possibleDateFilterOptions: DateFilterOption[] = [
  DateFilterOption.IS,
  DateFilterOption.IS_BEFORE,
  DateFilterOption.IS_AFTER,
  DateFilterOption.IS_BETWEEN,
  DateFilterOption.YEARS,
]

interface DateFilterState extends filterProps {
  state?: {
    date1: string
    date2: string
    selectedDateFilter: DateFilterOption
    isDateFilterSelectOpen: boolean
  }
}

const FilterDate = ({ id, dispatch, state }: DateFilterState) => {
  const [date1, setDate1] = useState(state?.date1 || '')
  const [date2, setDate2] = useState(state?.date2 || '')
  const [selectedDateFilter, setSelectedDateFilter] = useState(state?.selectedDateFilter || DateFilterOption.IS_BETWEEN)
  const [isDateFilterSelectOpen, setIsDateFilterSelectOpen] = useState(state?.isDateFilterSelectOpen || false)
  const [startYear, setStartYear] = useState('')
  const [endYear, setEndYear] = useState('')

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

  const handleYearChange = () => {
    if (startYear && endYear) {
      const startDate = `${startYear}-01-01`
      const endDate = `${endYear}-12-31`
      setDate1(startDate)
      setDate2(endDate)
    }
  }
  let dateString = 'Fecha'

  if (formatDateString(date1) !== 'Fecha inválida') {
    if (selectedDateFilter === DateFilterOption.IS_BETWEEN || selectedDateFilter === DateFilterOption.YEARS) {
      if (formatDateString(date2) !== 'Fecha inválida') {
        dateString = `Fecha: ${formatDateString(date1)} - ${formatDateString(date2)}`
      }
    } else {
      dateString = `Fecha: ${formatDateString(date1)}`
    }
  }

  return (
    <BaseFilter icon={<LucideCalendar />} text={dateString}>
      <button onClick={removeThisFilter} className="absolute right-2 top-1 h-4 w-4 text-red-600" title="Eliminar Filtro">
        <LucideTrash2 size={20} />
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

      {selectedDateFilter !== DateFilterOption.YEARS && (
        <div className="flex flex-row items-center gap-2">
          {/* First input to select the first date */}
          <input
            type="date"
            onChange={(e) => setDate1(e.target.value)}
            value={date1}
            className="w-24 rounded-md border border-gray-300 p-0.5 text-sm"
          />

          {/* Second input to select the second date (only used for the "between" filter) */}
          {selectedDateFilter === DateFilterOption.IS_BETWEEN && (
            <>
              <span>-</span>
              <input
                type="date"
                onChange={(e) => setDate2(e.target.value)}
                value={date2}
                className="w-24 rounded-md border border-gray-300 p-0.5 text-sm"
              />
            </>
          )}
        </div>
      )}
      {selectedDateFilter === DateFilterOption.YEARS && (
        <div className="mt-2 flex flex-row items-center gap-2">
          <label>
            <input
              type="number"
              value={startYear}
              onChange={(e) => setStartYear(e.target.value)}
              onBlur={handleYearChange}
              className="w-16 rounded-md border border-gray-300 p-0.5 text-sm"
            />
          </label>
          -
          <label>
            <input
              type="number"
              value={endYear}
              onChange={(e) => setEndYear(e.target.value)}
              onBlur={handleYearChange}
              className="w-16 rounded-md border border-gray-300 p-0.5 text-sm"
            />
          </label>
        </div>
      )}
      <button
        onClick={() =>
          dispatch({
            type: 'UPDATE_FILTER',
            payload: {
              id: id,
              state: { date1, date2, selectedDateFilter, isDateFilterSelectOpen },
            },
          })
        }
        className="mt-4 rounded bg-blue-500 px-2 py-1 text-white"
      >
        Aplicar
      </button>
    </BaseFilter>
  )
}

export default FilterDate
