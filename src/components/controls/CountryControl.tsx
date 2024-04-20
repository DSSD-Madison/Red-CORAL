import React, { useEffect, useRef, useState } from 'react'
import { DB, MarkerFilters } from 'types'

interface FilterControlProps {
  data: DB
  filters: MarkerFilters
  setFilters: React.Dispatch<React.SetStateAction<MarkerFilters>>
}

const CountryControl: React.FC<FilterControlProps> = ({ data, filters, setFilters }) => {
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

  const handleCheckboxChange = (name: string) => {
    setFilters((filters) => ({
      ...filters,
      hideCountries: [...filters.hideCountries, name],
    }))
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setFilters((filters) => ({
        ...filters,
        hideCountries: [],
      }))
    } else {
      setFilters((filters) => ({
        ...filters,
        hideCountries: Object.keys(Object.keys(data.filterBounds.locations)),
      }))
    }
  }

  const visibleDepartments = Object.entries(data.filterBounds.locations)
    .filter(([country]) => !filters.hideCountries.includes(country))
    .reduce(
      (acc, [country, departments]) => {
        acc[country] = Object.keys(departments).filter((department) => !filters.hideDepartments.includes(department))
        return acc
      },
      {} as { [country: string]: string[] }
    )

  return (
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
        C
      </a>
      {isDropdownVisible && (
        <div ref={dropdownRef}>
          <div className="leaflet-bar absolute -top-0.5 left-10 box-content h-96 w-60 rounded bg-tint-02/80 shadow-lg backdrop-blur-sm">
            <div className="flex flex-row justify-between">
              <div className="m-1 text-base font-semibold">Países</div>
              <div className="mx-1 flex flex-row justify-center align-middle">
                <label htmlFor="all" className="mx-2 mt-[5px]">
                  Seleccionar todo
                </label>
                <input
                  type="checkbox"
                  name="all"
                  checked={Object.keys(filters.hideCountries).length === 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </div>
            </div>
            <div className="h-max overflow-y-auto">
              {Object.keys(data.filterBounds.locations).map((country) => (
                <div key={country} className="mx-1 flex items-center border-b py-1 last-of-type:border-0 hover:bg-tint-02">
                  <input
                    type="checkbox"
                    name={country}
                    id={country}
                    checked={!filters.hideCountries?.includes(country)}
                    onChange={() => handleCheckboxChange(country)}
                    className="mr-2"
                  />
                  <label htmlFor={country} className="w-full">
                    {country}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface FilterCheckboxesProps {
  data: DB
  filters: MarkerFilters
  setFilters: React.Dispatch<React.SetStateAction<MarkerFilters>>
  ref: React.RefObject<HTMLDivElement>
  items: string[]
  title: string
  filterKey: 'hideCountries' | 'hideMunicipalities' | 'hideDepartments'
  childrenKeys: ('hideMunicipalities' | 'hideDepartments')[]
}

export default CountryControl
