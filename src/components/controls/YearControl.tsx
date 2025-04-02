import React, { useEffect, useRef, useState } from 'react'
import { MarkerFilters } from 'types'
import RangeSlider from 'react-range-slider-input'
import 'react-range-slider-input/dist/style.css'
import { useDB } from '@/context/DBContext'
import { LucideCalendar, LucideRotateCcw } from 'lucide-react'

interface YearControlProps {
  filters: MarkerFilters
  setFilters: React.Dispatch<React.SetStateAction<MarkerFilters>>
}

const YearControl: React.FC<YearControlProps> = ({ filters, setFilters }) => {
  const { db } = useDB()
  const [isDropdownVisible, setDropdownVisible] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { minYear, maxYear } = db.filterBounds

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
        <LucideCalendar className="h-5 w-5" strokeWidth={1} />
      </a>
      {isDropdownVisible && (
        <div
          ref={dropdownRef}
          className="leaflet-bar absolute -bottom-0.5 left-10 box-content w-[70vw] rounded bg-tint-02/80 shadow-lg backdrop-blur-sm"
        >
          <label className="block pl-4 pt-4 text-xl font-semibold" htmlFor="year">
            Año
          </label>
          <div className="flex items-end gap-4 p-2">
            <span className="mb-1 text-xl italic">{filters.startYear || minYear}</span>
            <RangeSlider
              min={minYear}
              max={maxYear}
              value={[filters.startYear || minYear, filters.endYear || maxYear]}
              onInput={(e) => handleRangeUpdate(e[0], e[1])}
              className="my-4 w-[760px] self-end"
            />
            <span className="mb-1 text-xl italic">{filters.endYear || maxYear}</span>
            <button
              className="mb-1 rounded border-2 border-tint-01 bg-white px-2 py-1 text-lg hover:bg-tint-02 active:bg-tint-01"
              onClick={handleResetRange}
            >
              <LucideRotateCcw className="h-5 w-5" strokeWidth={1} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default YearControl
