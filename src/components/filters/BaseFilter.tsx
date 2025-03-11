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
import { LucideChevronDown, LucideChevronRight } from 'lucide-react'

/**
 * Represents a filter chip that can be clicked to open a dropdown with more options. Handles the dropdown state and visibility.
 */
const BaseFilter = ({ icon, text, children, scrollOverflow }: { icon: any; text: string; children: ReactNode; scrollOverflow?: boolean }) => {
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
        apply({ availableWidth, availableHeight, elements }) {
          Object.assign(elements.floating.style, {
            maxWidth: `${Math.max(0, availableWidth - 20)}px`,
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
        className={`flex cursor-pointer items-center gap-2 rounded-full border  px-3 transition-all hover:shadow-md
          ${isOpen ? ' border-blue-600 bg-blue-100 text-blue-600 shadow-md' : 'border-gray-400 hover:bg-gray-200'}`}
        ref={refs.setReference}
        {...getReferenceProps()}
      >
        <icon.type size={16} strokeWidth={1} />
        <span>{text}</span>
        <span>
          <LucideChevronRight size={16} strokeWidth={1} style={{ transform: `rotate(${isOpen ? 90 : 0}deg)` }} />
        </span>
      </div>
      {isOpen && (
        <FloatingFocusManager context={context} modal={false}>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            className={
              'z-50 min-w-48 rounded-md border border-gray-300 bg-white px-1 py-2 shadow-lg focus-visible:outline-none' +
              (scrollOverflow ? ' overflow-y-auto' : '')
            }
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
