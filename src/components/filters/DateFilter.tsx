import { filterProps } from '@/filters/filterReducer'
import BaseFilter from './BaseFilter'
import { LucideCalendar, LucideChevronDown, LucideChevronRight } from 'lucide-react'
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
import { useDB } from '@/context/DBContext'

enum DateFilterOption {
  IS = 'es',
  IS_BEFORE = 'es anterior',
  IS_AFTER = 'es posterior',
  IS_BETWEEN = 'es entre',
  YEARS = 'es entre años',
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
  const { db } = useDB()
  const [date1, setDate1] = useState(state?.date1 || '')
  const [date2, setDate2] = useState(state?.date2 || '')
  const [selectedDateFilter, setSelectedDateFilter] = useState(state?.selectedDateFilter || DateFilterOption.IS_BETWEEN)
  const [isDateFilterSelectOpen, setIsDateFilterSelectOpen] = useState(false)

  const { refs, floatingStyles, context } = useFloating({
    open: isDateFilterSelectOpen,
    onOpenChange: setIsDateFilterSelectOpen,
    middleware: [offset(0), flip({ fallbackAxisSideDirection: 'end' }), shift()],
    whileElementsMounted: autoUpdate,
  })

  const click = useClick(context)
  const dismiss = useDismiss(context)
  const role = useRole(context)

  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss, role])

  const minYear = db.filterBounds.minYear
  const maxYear = db.filterBounds.maxYear
  const yearButtons = []
  for (let i = minYear; i <= maxYear; i++) {
    const date1Year = date1 ? new Date(date1).getUTCFullYear() : 0
    const date2Year = date2 ? new Date(date2).getUTCFullYear() : 0
    const additionalStyles =
      i == date1Year && i == date2Year
        ? 'rounded-md bg-blue-500 px-3 text-white'
        : i == date1Year
          ? 'rounded-l-md bg-blue-500 px-3 text-white'
          : i == date2Year
            ? 'rounded-r-md bg-blue-500 px-3 text-white'
            : date1Year < i && i < date2Year
              ? 'bg-blue-300 px-3'
              : 'mx-1 rounded-md bg-white hover:bg-gray-200 outline-1 outline outline-gray-300'
    yearButtons.push(
      <button
        key={i}
        onClick={() => {
          handleYearChange(i)
        }}
        className={`p-1 px-2 text-sm ${additionalStyles}`}
      >
        {i}
      </button>
    )
  }

  const handleYearChange = (i: number) => {
    const startDate = `${i}-01-01`
    const endDate = `${i}-12-31`
    // selected year could be upper or lower bound.
    // assume user picks lower, then upper
    if (date1 && !date2) {
      const date1Year = new Date(date1).getUTCFullYear()
      if (date1Year > i) {
        // swap if lower is greater than upper
        setDate2(`${date1Year}-12-31`)
        setDate1(startDate)
      } else {
        setDate2(endDate)
      }
    }
    // if both are set, reset upper and set lower
    // if the same year is selected thrice, reset both
    else if (date1 && date2) {
      const date1Year = new Date(date1).getUTCFullYear()
      const date2Year = new Date(date2).getUTCFullYear()
      if (date1Year === i && date2Year === i) {
        setDate1('')
        setDate2('')
      } else {
        setDate2('')
        setDate1(startDate)
      }
    }
    // if neither are set, set lower
    else if (!date1 && !date2) setDate1(startDate)
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
    <BaseFilter icon={<LucideCalendar />} text={dateString} dispatch={dispatch} id={id}>
      {/* Dropdown to select the filter option */}

      <p
        className="mb-2 flex w-max cursor-pointer flex-row items-center text-sm text-gray-600"
        onClick={() => setIsDateFilterSelectOpen(true)}
        ref={refs.setReference}
        {...getReferenceProps()}
      >
        Fecha {selectedDateFilter}
        <span>{isDateFilterSelectOpen ? <LucideChevronDown size={16} strokeWidth={1} /> : <LucideChevronRight size={16} strokeWidth={1} />}</span>
      </p>

      {isDateFilterSelectOpen && (
        <FloatingFocusManager context={context} modal={false}>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            className="z-10 min-w-48 rounded-md border border-gray-300 bg-white px-1 py-2 shadow-md focus-visible:outline-none"
            {...getFloatingProps()}
          >
            <h2 className="p-1 text-sm font-semibold">Opción de filtro</h2>
            {possibleDateFilterOptions.map((dateFilterOption) => (
              <button
                key={dateFilterOption}
                className="flex w-full items-center gap-2 rounded-md p-1 hover:bg-black/5"
                onClick={() => {
                  setDate1('')
                  setDate2('')
                  setIsDateFilterSelectOpen(false)
                  setSelectedDateFilter(dateFilterOption)
                }}
              >
                <span>{dateFilterOption}</span>
              </button>
            ))}
          </div>
        </FloatingFocusManager>
      )}

      {selectedDateFilter !== DateFilterOption.YEARS && (
        <div className="flex flex-row items-center gap-2">
          {/* First input to select the first date */}
          <input
            type="date"
            onChange={(e) => setDate1(e.target.value)}
            value={date1}
            className="w-32 rounded-md border border-gray-300 p-0.5 text-sm"
          />

          {/* Second input to select the second date (only used for the "between" filter) */}
          {selectedDateFilter === DateFilterOption.IS_BETWEEN && (
            <>
              <span>-</span>
              <input
                type="date"
                onChange={(e) => setDate2(e.target.value)}
                value={date2}
                className="w-32 rounded-md border border-gray-300 p-0.5 text-sm"
              />
            </>
          )}
        </div>
      )}
      {selectedDateFilter === DateFilterOption.YEARS && <div className="flex flex-row flex-wrap">{yearButtons}</div>}
      <button
        onClick={() =>
          dispatch({
            type: 'UPDATE_FILTER',
            payload: {
              id: id,
              state: { date1, date2, selectedDateFilter },
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
