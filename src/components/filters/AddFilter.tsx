import { useRef, useState } from 'react'
import DateFilter from './DateFilter'
import LatLongFilter from './LatLongFilter'
import { filterDispatchType, filterProps } from './filterReducer'
import { LucideCalendar, LucideGlobe, LucideMapPin, LucidePlus, LucideTags, LucideText, LucideMerge } from 'lucide-react'
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
import ORFilter from './ORFilter'
import NOTFilter from './NOTFilter'

interface FilterInfo {
  name: string
  icon: any
  component: React.FC<filterProps>
  description: string
}

const possibleFilters: FilterInfo[] = [
  {
    name: 'Actividades',
    icon: LucideTags,
    component: DateFilter, // TODO: Change this to the actual component
    description: 'Filtrar por actividades y tipos de eventos',
  },
  {
    name: 'Fecha',
    icon: LucideCalendar,
    component: DateFilter,
    description: 'Filtrar por fecha',
  },
  {
    name: 'Latitud/Longitud',
    icon: LucideMapPin,
    component: LatLongFilter,
    description: 'Filtrar por ubicación',
  },
  {
    name: 'Áreas',
    icon: LucideGlobe,
    component: CountryFilter,
    description: 'Filtrar por áreas geográficas',
  },
  {
    name: 'Descripción',
    icon: LucideText,
    component: DateFilter, // TODO: Change this to the actual component
    description: 'Filtrar por palabras clave en la descripción',
  },
]

const advancedFilters: FilterInfo[] = [
  {
    name: 'O (combinar)',
    icon: LucideMerge,
    component: ORFilter,
    description: 'Combinar filtros con la operación OR',
  },
  {
    name: 'NO (combinar)',
    icon: LucideMerge,
    component: NOTFilter,
    description: 'Combinar filtros con la operación NOT',
  },
]

function NewFilterButton({ filter, dispatch }: { filter: FilterInfo; dispatch: React.Dispatch<filterDispatchType> }) {
  return (
    <button
      key={filter.name}
      className="block w-full rounded-md px-2 py-1 text-left hover:bg-black/5"
      onClick={() => dispatch({ type: 'ADD_FILTER', payload: { component: filter.component } })}
    >
      <span>
        {filter.icon && <filter.icon size={12} className="mr-1 inline align-baseline" />}
        {filter.name}
      </span>
      <p className="text-xs text-neutral-700">{filter.description}</p>
    </button>
  )
}

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
    <div onClick={() => setIsOpen(true)} className="text-sm" ref={refs.setReference} {...getReferenceProps()}>
      <span className="cursor-pointer text-gray-600">
        {' '}
        <LucidePlus size={16} strokeWidth={1} className="inline align-baseline" />
        Añadir filtro
      </span>
      {isOpen && (
        <FloatingFocusManager context={context} modal={false}>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            className="z-50 min-w-48 rounded-md border border-gray-300 bg-white p-2 shadow-lg focus-visible:outline-none"
            {...getFloatingProps()}
          >
            <FloatingArrow fill="white" strokeWidth={1} stroke="#d1d5db" ref={arrowRef} context={context} />
            <h2 className="p-1 text-sm font-semibold">Filtros básicos</h2>
            {possibleFilters.map((filter) => (
              <NewFilterButton filter={filter} dispatch={dispatch} />
            ))}
            <h2 className="p-1 text-sm font-semibold">Filtros avanzados</h2>
            {advancedFilters.map((filter) => (
              <NewFilterButton filter={filter} dispatch={dispatch} />
            ))}
          </div>
        </FloatingFocusManager>
      )}
    </div>
  )
}

export default AddFilter