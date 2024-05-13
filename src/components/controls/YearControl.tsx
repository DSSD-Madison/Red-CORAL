import React, { useEffect, useRef, useState } from 'react'
import { DB, MarkerFilters } from 'types'
import RangeSlider from 'react-range-slider-input'
import 'react-range-slider-input/dist/style.css'

interface YearControlProps {
  data: DB
  filters: MarkerFilters
  setFilters: React.Dispatch<React.SetStateAction<MarkerFilters>>
}

const YearControl: React.FC<YearControlProps> = ({ data, filters, setFilters }) => {
  const [isDropdownVisible, setDropdownVisible] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { minYear, maxYear } = data.filterBounds

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

  const handleResetRange = () => {
    setFilters((filters) => ({
      ...filters,
      startYear: null,
      endYear: null,
    }))
  }

  const handleRangeUpdate = (lower: number, upper: number) => {
    setFilters((filters) => ({
      ...filters,
      startYear: lower,
      endYear: upper,
    }))
  }

  return (
    <div className="leaflet-bar relative w-fit rounded">
      <a
        className="leaflet-control-zoom-in rounded"
        title={'Filtrar por año'}
        role="button"
        onClick={(e) => {
          setDropdownVisible(!isDropdownVisible)
          e.preventDefault()
        }}
      >
        {/* ⧗ */}
        &#x029D7;
      </a>
      {isDropdownVisible && (
        <div
          ref={dropdownRef}
          className="leaflet-bar absolute -bottom-0.5 left-10 box-content w-[50vw] rounded bg-tint-02/80 shadow-lg backdrop-blur-sm"
        >
          <label className="block text-center text-xl font-semibold" htmlFor="year">
            Año
          </label>
          <div className="flex w-full items-center justify-center gap-2 p-2">
            <button
              className="rounded border-2 border-tint-01 bg-white px-2 py-1 text-lg hover:bg-tint-02 active:bg-tint-01"
              onClick={handleResetRange}
            >
              Restablecer
            </button>
            {filters.startYear || minYear}
            <RangeSlider
              min={minYear}
              max={maxYear}
              value={[filters.startYear || minYear, filters.endYear || maxYear]}
              onInput={(e) => handleRangeUpdate(e[0], e[1])}
              className="flex-grow"
            />
            {filters.endYear || maxYear}
          </div>
        </div>
      )}
    </div>
  )
}

export default YearControl
