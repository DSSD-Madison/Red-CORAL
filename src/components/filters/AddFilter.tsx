import { Dispatch, useRef, useState } from 'react'
import { filterDispatchType, filterType } from '@/filters/filterReducer'
import { LucideBlend, LucideCalendar, LucideCircleOff, LucideGlobe, LucideMapPin, LucidePlus, LucideTags, LucideText } from 'lucide-react'
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
interface FilterInfo {
  name: string
  icon: any
  description: string
  type: filterType['type']
}

const possibleFilters: FilterInfo[] = [
  {
    name: 'Actividades',
    icon: LucideTags,
    description: 'Filtrar por actividades y tipos de incidentes',
    type: 'category',
  },
  {
    name: 'Fecha',
    icon: LucideCalendar,
    description: 'Filtrar por fecha',
    type: 'date',
  },
  {
    name: 'Latitud/Longitud',
    icon: LucideMapPin,
    description: 'Filtrar por ubicación',
    type: 'latlong',
  },
  {
    name: 'Áreas',
    icon: LucideGlobe,
    description: 'Filtrar por áreas geográficas',
    type: 'country',
  },
  {
    name: 'Descripción',
    icon: LucideText,
    description: 'Filtrar por palabras clave en la descripción',
    type: 'desc',
  },
  {
    name: 'NO',
    icon: LucideCircleOff,
    description: 'Negar los filtros dentro de este filtro',
    type: 'not',
  },
  {
    name: 'O',
    icon: LucideBlend,
    description: 'Unir los filtros dentro de este filtro',
    type: 'or',
  },
]

function NewFilterButton({ filter, dispatch }: { filter: FilterInfo; dispatch: Dispatch<filterDispatchType> }) {
  return (
    <button
      className="block w-full rounded-md px-2 py-1 text-left hover:bg-black/5"
      onClick={() => dispatch({ type: 'ADD_FILTER', payload: { type: filter.type } })}
    >
      <span className="flex items-center">
        {filter.icon && <filter.icon size={12} className="mr-1" />}
        {filter.name}
      </span>
      <p className="text-xs text-neutral-700">{filter.description}</p>
    </button>
  )
}

const AddFilter = ({ dispatch }: { dispatch: Dispatch<filterDispatchType> }) => {
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
      <span className="flex cursor-pointer items-center text-gray-600">
        <LucidePlus size={16} strokeWidth={1} />
        Añadir filtro
      </span>
      {isOpen && (
        <FloatingFocusManager context={context} modal={false}>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            className="z-50 w-64 rounded-md border border-gray-300 bg-white p-2 shadow-lg focus-visible:outline-none"
            {...getFloatingProps()}
          >
            <FloatingArrow fill="white" strokeWidth={1} stroke="#d1d5db" ref={arrowRef} context={context} />
            <h2 className="p-1 text-sm font-semibold">Filtros básicos</h2>
            {possibleFilters.map((filter) => (
              <NewFilterButton key={filter.name} filter={filter} dispatch={dispatch} />
            ))}
          </div>
        </FloatingFocusManager>
      )}
    </div>
  )
}

export default AddFilter
