import { MutableRefObject, ReactNode, useRef, useState } from 'react'
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
  size,
  useTransitionStyles,
} from '@floating-ui/react'
import { LucideChevronRight, LucideTrash2 } from 'lucide-react'
import { filterDispatchType } from '@/filters/filterReducer'

/**
 * Represents a filter chip that can be clicked to open a dropdown with more options. Handles the dropdown state and visibility.
 */
const BaseFilter = ({
  icon,
  text,
  children,
  scrollOverflow,
  dispatch,
  id,
}: {
  icon: any
  text: string
  children: ReactNode
  scrollOverflow?: boolean
  dispatch: React.Dispatch<filterDispatchType>
  id: number
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const arrowRef = useRef(null)
  const innerSizeRef: MutableRefObject<HTMLDivElement | null> = useRef(null)

  const removeThisFilter = () => {
    dispatch({ type: 'REMOVE_FILTER', payload: { id: id } })
  }

  const { refs, floatingStyles, context, middlewareData } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: 'bottom-start',
    middleware: [
      offset(5),
      shift({ padding: 10 }),
      size({
        apply({ availableWidth, availableHeight }) {
          Object.assign(innerSizeRef.current?.style || {}, {
            maxWidth: `${Math.max(0, availableWidth - 20)}px`,
            maxHeight: `${Math.max(0, availableHeight - 5)}px`,
          })
        },
      }),
      arrow({ element: arrowRef, padding: 10 }),
    ],
    whileElementsMounted: autoUpdate,
  })
  const ARROW_WIDTH = 16
  const ARROW_HEIGHT = 14
  const arrowX = middlewareData.arrow?.x ?? 0
  const arrowY = middlewareData.arrow?.y ?? 0
  const transformX = arrowX + ARROW_WIDTH / 2
  const transformY = arrowY + ARROW_HEIGHT
  const { isMounted, styles: transitionStyles } = useTransitionStyles(context, {
    initial: () => ({
      transform: 'scale(0.95)',
      opacity: 0,
    }),
    common: ({ side }) => ({
      transformOrigin: {
        top: `${transformX}px calc(100% + ${ARROW_HEIGHT}px)`,
        bottom: `${transformX}px ${-ARROW_HEIGHT}px`,
        left: `calc(100% + ${ARROW_HEIGHT}px) ${transformY}px`,
        right: `${-ARROW_HEIGHT}px ${transformY}px`,
      }[side],
    }),
  })

  const click = useClick(context)
  const dismiss = useDismiss(context)
  const role = useRole(context)

  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss, role])

  return (
    <>
      <div
        onClick={() => setIsOpen(true)}
        className={`relative flex cursor-pointer select-none items-center overflow-hidden rounded-full border pl-3 transition-all hover:shadow-md has-[button:hover,button:active]:border-gray-600 has-[button:hover,button:active]:bg-gray-100 has-[button:hover,button:active]:text-gray-600 
          ${isOpen ? ' border-blue-600 bg-blue-100 pr-10 text-blue-600 shadow-md' : 'border-gray-400 pr-2 hover:bg-gray-200'}`}
        ref={refs.setReference}
        {...getReferenceProps()}
      >
        <icon.type size={16} strokeWidth={1} className="mr-2" />
        <span className="mr-2 align-top">{text}</span>
        <span>
          <LucideChevronRight size={16} strokeWidth={1} style={{ transform: `rotate(${isOpen ? 90 : 0}deg)` }} />
        </span>
        <button
          onClick={removeThisFilter}
          className={`absolute bottom-0 right-0 top-0 flex h-full w-4 items-center justify-center rounded-full border-gray-600 bg-white text-red-600 transition hover:border-red-600 hover:bg-red-200 hover:shadow-md ${isOpen ? 'w-8 border-l opacity-100' : 'w-0 opacity-0'}`}
          title="Eliminar Filtro"
        >
          <LucideTrash2 size={16} />
        </button>
      </div>
      {isMounted && (
        <FloatingFocusManager context={context} modal={false}>
          <div ref={refs.setFloating} style={floatingStyles} className="z-50" {...getFloatingProps()}>
            <div style={transitionStyles}>
              <FloatingArrow fill="white" strokeWidth={1} stroke="#d1d5db" ref={arrowRef} context={context} />
              <div
                style={{ maxWidth: floatingStyles.maxWidth, maxHeight: floatingStyles.maxHeight }}
                ref={innerSizeRef}
                className={
                  'w-auto rounded-md border border-gray-300 bg-white px-3 py-2 text-black accent-blue-600 shadow-lg focus-visible:outline-none' +
                  (scrollOverflow ? ' overflow-y-auto' : '')
                }
              >
                {children}
              </div>
            </div>
          </div>
        </FloatingFocusManager>
      )}
    </>
  )
}

export default BaseFilter
