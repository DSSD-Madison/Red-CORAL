import { ReactNode, useState } from 'react'
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

/**
 * Represents a filter chip that can be clicked to open a dropdown with more options. Handles the dropdown state and visibility.
 */
const BaseFilter = ({ icon, text, children }: { icon: any; text: string; children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false)

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [offset(10), flip(), shift()],
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
        className="flex items-center gap-2 rounded-full border border-gray-300 px-3"
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
            className="min-w-48 rounded-md border border-gray-300 bg-white px-1 py-2 focus-visible:outline-none"
            {...getFloatingProps()}
          >
            {children}
          </div>
        </FloatingFocusManager>
      )}
    </>
  )
}

export default BaseFilter
