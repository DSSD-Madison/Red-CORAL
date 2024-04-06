import React, { useEffect, useRef, useState } from 'react'

import Control from 'react-leaflet-custom-control'
import { DB, MarkerFilters } from 'types'

interface YearControlProps {
  data: DB
  filters: MarkerFilters
  setFilters: React.Dispatch<React.SetStateAction<MarkerFilters>>
}

const YearControl: React.FC<YearControlProps> = ({ data, filters, setFilters }) => {
  const [isDropdownVisible, setDropdownVisible] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setDropdownVisible(false)
    }
  }

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const minYear = Math.min(...Object.values(data.Incidents).map((e) => new Date(e.dateString).getFullYear()))
  const maxYear = Math.max(...Object.values(data.Incidents).map((e) => new Date(e.dateString).getFullYear()))

  const handleResetRange = () => {
    setFilters((filters) => ({
      ...filters,
      startYear: null,
      endYear: null,
    }))
  }
  const handleRangeUpdate = (newYear: number) => {
    setFilters((filters) => ({
      ...filters,
      startYear: newYear,
      endYear: newYear,
    }))
  }

  return (
    <Control prepend position="bottomleft">
      <div className="leaflet-bar relative rounded">
        <a
          className="leaflet-control-zoom-in rounded"
          title={'Tags'}
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
            className="leaflet-bar absolute -bottom-0.5 left-10 box-content h-24 w-[calc(100vw-4.25rem)] rounded bg-tint-02/80 shadow-lg backdrop-blur-sm"
          >
            <label className="block text-center text-xl font-semibold" htmlFor="year">
              Año
            </label>
            <div className="flex w-full items-center justify-center gap-2 p-2">
              <button
                className="rounded border-2 border-tint-01 bg-white px-2 py-1 text-lg hover:bg-tint-02 active:bg-tint-01"
                onClick={handleResetRange}
              >
                Reset
              </button>
              {minYear}
              <input
                type="range"
                min={minYear}
                max={maxYear}
                value={filters.startYear || minYear}
                onMouseEnter={() => (filters.endYear == null ? handleRangeUpdate(minYear) : null)}
                onChange={(e) => handleRangeUpdate(parseInt(e.target.value))}
                className="flex-grow"
              />
              {maxYear}
              <span className="text-lg font-semibold">{filters.startYear || minYear}</span>
            </div>
          </div>
        )}
      </div>
    </Control>
  )
}

export default YearControl
