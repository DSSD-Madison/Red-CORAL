import { useState } from 'react'
import DateFilter from './DateFilter'
import { filterDispatchType } from '@/pages/StatsDashboard'
import { LucideCalendar, LucidePlus } from 'lucide-react'
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

const possibleFilters = [
  {
    name: 'Fecha',
    icon: LucideCalendar,
    component: DateFilter,
  },
  {
    name: 'Fecha2',
    icon: LucideCalendar,
    component: DateFilter,
  },
  {
    name: 'Fecha3',
    icon: LucideCalendar,
    component: DateFilter,
  },
]

const AddFilter = ({ dispatch }: { dispatch: React.Dispatch<filterDispatchType> }) => {
  const [isOpen, setIsOpen] = useState(false)

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [offset(10), flip({ fallbackAxisSideDirection: 'end' }), shift()],
    whileElementsMounted: autoUpdate,
  })

  const click = useClick(context)
  const dismiss = useDismiss(context)
  const role = useRole(context)

  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss, role])

  return (
    <div onClick={() => setIsOpen(true)} className="flex cursor-pointer items-center text-sm" ref={refs.setReference} {...getReferenceProps()}>
      <LucidePlus size={16} strokeWidth={1} />
      <span className="text-gray-600">Añadir filtro</span>
      {isOpen && (
        <FloatingFocusManager context={context} modal={false}>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            className="min-w-48 rounded-md border border-gray-300 bg-white px-1 py-2 focus-visible:outline-none"
            {...getFloatingProps()}
          >
            <h2 className="p-1 text-sm font-semibold">Añadir filtro</h2>
            {possibleFilters.map((filter) => (
              <button
                key={filter.name}
                className="flex w-full items-center gap-2 rounded-md p-1 hover:bg-black/5"
                onClick={() => dispatch({ type: 'ADD_FILTER', payload: { component: filter.component } })}
              >
                {filter.icon && <filter.icon size={12} />}
                <span>{filter.name}</span>
              </button>
            ))}
          </div>
        </FloatingFocusManager>
      )}
    </div>
  )
}

export default AddFilter
