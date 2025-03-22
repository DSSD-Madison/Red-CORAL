import AutocompleteSearch from 'components/AutocompleteSearch'
import { LucideSearch } from 'lucide-react'
import React, { useState, useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import { LatLngBoundsExpression, LatLngTuple } from 'leaflet'

const SearchControl: React.FC<{}> = () => {
  const map = useMap()
  const [bounds, setBounds] = useState<number[] | undefined>(undefined)
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

  useEffect(() => {
    if (bounds) {
      const boundsExp: LatLngBoundsExpression = [bounds.slice(0, 2).reverse() as LatLngTuple, bounds.slice(2).reverse() as LatLngTuple]
      map.flyToBounds(boundsExp, { paddingTopLeft: [300, 0], duration: 3, easeLinearity: 0.5 })
      setDropdownVisible(false)
    }
  }, [bounds])

  return (
    <>
      <a
        className="leaflet-control-zoom-out"
        title={'Buscar un lugar'}
        role="button"
        onClick={(e) => {
          setDropdownVisible(!isDropdownVisible)
          e.preventDefault()
        }}
      >
        <LucideSearch className="h-5 w-5" strokeWidth={1} />
      </a>
      {isDropdownVisible && (
        <div ref={dropdownRef} className="absolute left-10 top-0.5 z-[1000]">
          <div className="leaflet-bar box-content rounded bg-tint-02/80 p-4 shadow-lg backdrop-blur-sm">
            <div className="mb-2 text-base font-semibold">Buscar un lugar</div>
            <div className="w-64">
              <AutocompleteSearch setBounds={setBounds} />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default SearchControl
