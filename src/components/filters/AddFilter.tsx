import { useRef, useState } from 'react'
import DateFilter from './DateFilter'
import FilterLocation from './FilterLocation'
import { filterDispatchType } from '@/pages/StatsDashboard'
import { LucideCalendar, LucideGlobe, LucideMapPin, LucidePlus, LucideTags, LucideText, MapPin } from 'lucide-react'
import {
  useFloating,
  offset,
  shift,
  autoUpdate,
  useClick,
  useDismiss,
  useRole,
  useInteractions,
  FloatingFocusManager,
  FloatingArrow,
  arrow,
} from '@floating-ui/react'
import CountryFilter from './CountryFilter'

const possibleFilters = [
  {
    name: 'Actividades',
    icon: LucideTags,
    component: DateFilter, // TODO: Change this to the actual component
  },
  {
    name: 'Fecha',
    icon: LucideCalendar,
    component: DateFilter, // TODO: Change this to the actual component
  },
  {
    name: 'Latitud/Longitud',
    icon: MapPin,
    component: FilterLocation,
  },
  {
    name: 'Áreas',
    icon: LucideGlobe,
    component: CountryFilter,
  },
  {
    name: 'Descripción',
    icon: LucideText,
    component: DateFilter, // TODO: Change this to the actual component
  },
]

const AddFilter = ({ dispatch }: { dispatch: React.Dispatch<filterDispatchType> }) => {
  const [isOpen, setIsOpen] = useState(false)
  const arrowRef = useRef(null)

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: 'bottom-start',
    middleware: [offset(10), shift({ padding: 10 }), arrow({ element: arrowRef })],
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
            className="min-w-48 rounded-md border border-gray-300 bg-white px-1 py-2 shadow-lg focus-visible:outline-none"
            {...getFloatingProps()}
          >
            <FloatingArrow fill="white" strokeWidth={1} stroke="#d1d5db" ref={arrowRef} context={context} />
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
