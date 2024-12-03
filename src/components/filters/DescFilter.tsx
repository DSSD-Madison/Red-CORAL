import { filterProps } from '@/pages/StatsDashboard'
import BaseFilter from './BaseFilter'
import { LucideCalendar, LucideChevronDown, LucideChevronRight, LucideTrash2 } from 'lucide-react'
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

enum DescFilterOption {
  CONTAINS = 'contiene',
}
const possibleDescFilterOptions: DescFilterOption[] = [
  DescFilterOption.CONTAINS,
]

const FilterDesc = ({ id, dispatch }: filterProps) => {
  const [search, setSearch] = useState('')
  const [selectedDescFilter, setSelectedDescFilter] = useState(DescFilterOption.CONTAINS)
  const [isDescFilterSelectOpen, setIsDescFilterSelectOpen] = useState(false)

  useEffect(() => {
    switch (selectedDescFilter) {
      case DescFilterOption.CONTAINS:
        dispatch({ type: 'UPDATE_FILTER', payload: { id: id, operation: (incident) => incident.description.includes(search) } })
        break
    }
  }, [search, selectedDescFilter])

  const removeThisFilter = () => {
    dispatch({ type: 'REMOVE_FILTER', payload: { id: id } })
  }

  const { refs, floatingStyles, context } = useFloating({
    open: isDescFilterSelectOpen,
    onOpenChange: setIsDescFilterSelectOpen,
    middleware: [offset(10), flip({ fallbackAxisSideDirection: 'end' }), shift()],
    whileElementsMounted: autoUpdate,
  })

  const click = useClick(context)
  const dismiss = useDismiss(context)
  const role = useRole(context)

  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss, role])

  return (
    <BaseFilter
      icon={<LucideCalendar />}
      text={
        `La descripción contiene «${search}»`
      }
    >
      <button onClick={removeThisFilter} className="absolute right-2 top-1 h-4 w-4 text-red-600" title="Eliminar Filtro">
        <LucideTrash2 size={20} />
      </button>

      {/* Dropdown to select the filter option */}
      <div
        onClick={() => setIsDescFilterSelectOpen(true)}
        className="flex cursor-pointer items-center text-sm"
        ref={refs.setReference}
        {...getReferenceProps()}
      >
        <p className="flex flex-row items-center text-gray-600">
          Fecha {selectedDescFilter}
          <span>{isDescFilterSelectOpen ? <LucideChevronDown size={16} strokeWidth={1} /> : <LucideChevronRight size={16} strokeWidth={1} />}</span>
        </p>

        {isDescFilterSelectOpen && (
          <FloatingFocusManager context={context} modal={false}>
            <div
              ref={refs.setFloating}
              style={floatingStyles}
              className="z-10 min-w-48 rounded-md border border-gray-300 bg-white px-1 py-2 focus-visible:outline-none"
              {...getFloatingProps()}
            >
              <h2 className="p-1 text-sm font-semibold">Opción de filtro</h2>
              {possibleDescFilterOptions.map((DescFilterOption) => (
                <button
                  key={DescFilterOption}
                  className="flex w-full items-center gap-2 rounded-md p-1 hover:bg-black/5"
                  onClick={() => setSelectedDescFilter(DescFilterOption)}
                >
                  <span>{DescFilterOption}</span>
                </button>
              ))}
            </div>
          </FloatingFocusManager>
        )}
      </div>

      <div className="flex flex-row items-center gap-2">
        {/* First input to select the first date */}
        <input type="text" onChange={(e) => setSearch(e.target.value)} value={search} className="rounded-md border border-gray-300 p-1" />
      </div>
    </BaseFilter>
  )
}

export default FilterDesc
