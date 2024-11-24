import { ReactNode, useRef, useState } from 'react'
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
} from '@floating-ui/react'

/**
 * Represents a filter chip that can be clicked to open a dropdown with more options. Handles the dropdown state and visibility.
 */
const BaseFilter = ({ icon, text, children }: { icon: any; text: string; children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false)
  const arrowRef = useRef(null)

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: 'bottom-start',
    middleware: [
      offset(10),
      shift({ padding: 10 }),
      size({
        apply({ availableHeight, elements }) {
          Object.assign(elements.floating.style, {
            maxHeight: `${Math.max(0, availableHeight - 10)}px`,
          })
        },
      }),
      arrow({ element: arrowRef }),
    ],
    whileElementsMounted: autoUpdate,
  })

  const click = useClick(context)
  const dismiss = useDismiss(context)
  const role = useRole(context)

  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss, role])

  return (
    <>
      <div
        onClick={() => setIsOpen(true)}
        className={'flex items-center gap-2 rounded-full border border-gray-300 px-3' + (isOpen ? ' border-blue-600 text-blue-600' : '')}
        ref={refs.setReference}
        {...getReferenceProps()}
      >
        <icon.type size={16} strokeWidth={1} />
        <span>{text}</span>
      </div>
      {isOpen && (
        <FloatingFocusManager context={context} modal={false}>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            className="z-50 min-w-48 rounded-md border border-gray-300 bg-white px-1 py-2 shadow-lg focus-visible:outline-none"
            {...getFloatingProps()}
          >
            <FloatingArrow fill="white" strokeWidth={1} stroke="#d1d5db" ref={arrowRef} context={context} />
            {children}
          </div>
        </FloatingFocusManager>
      )}
    </>
  )
}

export default BaseFilter
