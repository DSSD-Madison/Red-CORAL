import { useIsMobile } from '@/hooks/useIsMobile'
import React, { useEffect, useRef } from 'react'
import { Sheet } from 'react-modal-sheet'

interface ResponsiveDropdownProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  desktopClassName?: string
  snapPoints?: number[]
}

export const ResponsiveDropdown: React.FC<ResponsiveDropdownProps> = ({
  isOpen,
  onClose,
  children,
  desktopClassName = 'absolute left-10 top-0.5 z-[1000]',
  snapPoints = [0.6],
}) => {
  const isMobile = useIsMobile()
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen && !isMobile) {
      document.addEventListener('pointerdown', handleClickOutside)
      return () => {
        document.removeEventListener('pointerdown', handleClickOutside)
      }
    }
  }, [isOpen, isMobile, onClose])

  if (!isOpen) return null

  if (isMobile) {
    return (
      <Sheet isOpen={isOpen} onClose={onClose} snapPoints={snapPoints}>
        <Sheet.Container>
          <Sheet.Header />
          <Sheet.Content className="px-2 pb-2">
            <div className="flex h-full flex-col gap-4 overflow-y-auto pt-2">{children}</div>
          </Sheet.Content>
        </Sheet.Container>
        <Sheet.Backdrop />
      </Sheet>
    )
  }

  return (
    <div ref={dropdownRef} className={desktopClassName}>
      {children}
    </div>
  )
}
