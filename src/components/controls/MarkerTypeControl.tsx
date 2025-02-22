import { LucideMapPinned } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'

interface MarkerTypeControlProps {
  markerType: 'single' | 'group' | 'groupPie'
  setMarkerType: React.Dispatch<React.SetStateAction<'single' | 'group' | 'groupPie'>>
}

const MarkerTypeControl: React.FC<MarkerTypeControlProps> = ({ markerType, setMarkerType }) => {
  const [isDropdownVisible, setDropdownVisible] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setDropdownVisible(false)
    }
  }

  useEffect(() => {
    document.addEventListener('pointerdown', handleClickOutside)
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside)
    }
  }, [])

  return (
    <>
      <a
        className="leaflet-control-zoom-out"
        title={'Cambiar tipo de marcador'}
        role="button"
        onClick={(e) => {
          setDropdownVisible(!isDropdownVisible)
          e.preventDefault()
        }}
      >
        <LucideMapPinned strokeWidth={1} />
      </a>
      {isDropdownVisible && (
        <div ref={dropdownRef} className="absolute left-10 top-0.5 z-[1000]">
          <div className="leaflet-bar box-content rounded bg-tint-02/80 p-4 shadow-lg backdrop-blur-sm">
            <div className="mb-2 text-base font-semibold">Tipo de marcador</div>
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={`h-32 w-32 cursor-pointer rounded border-2 p-2 hover:bg-tint-02 ${markerType === 'single' ? 'border-blue-500' : 'border-transparent'}`}
                  onClick={() => {
                    setMarkerType('single')
                    setDropdownVisible(false)
                  }}
                >
                  <div className="flex h-full items-center justify-center">
                    <img className="aspect-square w-full rounded-lg object-cover" src="individual-marker.png" alt="Marcador individual" />
                  </div>
                </div>
                <span className="mt-2 text-sm">Individual</span>
              </div>

              <div className="flex flex-col items-center">
                <div
                  className={`h-32 w-32 cursor-pointer rounded border-2 p-2 hover:bg-tint-02 ${markerType === 'group' ? 'border-blue-500' : 'border-transparent'}`}
                  onClick={() => {
                    setMarkerType('group')
                    setDropdownVisible(false)
                  }}
                >
                  <div className="flex h-full items-center justify-center">
                    <img className="aspect-square w-full rounded-lg object-cover" src="group-marker.png" alt="Marcador de grupo" />
                  </div>
                </div>
                <span className="mt-2 text-sm">Grupo</span>
              </div>

              <div className="flex flex-col items-center">
                <div
                  className={`h-32 w-32 cursor-pointer rounded border-2 p-2 hover:bg-tint-02 ${markerType === 'groupPie' ? 'border-blue-500' : 'border-transparent'}`}
                  onClick={() => {
                    setMarkerType('groupPie')
                    setDropdownVisible(false)
                  }}
                >
                  <div className="flex h-full items-center justify-center">
                    <img className="aspect-square w-full rounded-lg object-cover" src="group-pie-marker.png" alt="Marcador de grupo circular" />
                  </div>
                </div>
                <span className="mt-2 text-sm">Gráfico circular</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default MarkerTypeControl
