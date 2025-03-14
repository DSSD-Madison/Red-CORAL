import { useDB } from '@/context/DBContext'
import React, { useEffect, useRef, useState } from 'react'
import { MarkerFilters } from 'types'

interface FilterControlProps {
  filters: MarkerFilters
  setFilters: React.Dispatch<React.SetStateAction<MarkerFilters>>
}

const CountryControl: React.FC<FilterControlProps> = ({ filters, setFilters }) => {
  const { db } = useDB()
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

  const visibleDepartments = Object.fromEntries(
    Object.entries(db.filterBounds.locations)
      .filter(([country]) => !filters.hideCountries.includes(country))
      .map(([country, departments]) => {
        // For Mar Caribe and Océano Pacífico, if they only have a blank department, don't show it
        if (
          (country === 'Mar Caribe' || country === 'Océano Pacífico') &&
          Object.keys(departments).length === 1 &&
          Object.keys(departments)[0] === ''
        ) {
          return [country, {}]
        }
        return [country, departments]
      })
  )

  const handleConCheckboxChange = (key: string, checked: boolean) => {
    if (checked) {
      setFilters((filters) => ({
        ...filters,
        hideCountries: filters.hideCountries.filter((el) => el !== key),
      }))
    } else {
      setFilters((filters) => ({
        ...filters,
        hideCountries: [...filters.hideCountries, key],
        hideDepartments: filters.hideDepartments.filter((dep) => !dep.startsWith(key)),
      }))
    }
  }

  const handleDepCheckboxChange = (con: string, dep: string, checked: boolean) => {
    const key = `${con} - ${dep}`
    if (checked) {
      setFilters((filters) => ({
        ...filters,
        hideDepartments: filters.hideDepartments.filter((el) => el !== key),
      }))
    } else {
      setFilters((filters) => ({
        ...filters,
        hideDepartments: [...filters.hideDepartments, key],
      }))
    }
  }

  const handleConSelectAll = (checked: boolean) => {
    if (checked) {
      setFilters((filters) => ({
        ...filters,
        hideCountries: [],
      }))
    } else {
      setFilters((filters) => ({
        ...filters,
        hideCountries: Object.keys(db.filterBounds.locations),
      }))
    }
  }

  const handleDepSelectAll = (checked: boolean) => {
    if (checked) {
      setFilters((filters) => ({
        ...filters,
        hideDepartments: [],
      }))
    } else {
      setFilters((filters) => ({
        ...filters,
        hideDepartments: Object.entries(visibleDepartments).flatMap(([con, deps]) => Object.keys(deps).map((muni) => `${con} - ${muni}`)),
      }))
    }
  }

  return (
    <>
      <a
        className="leaflet-control-zoom-out"
        title={'Filtrar por país/departamento'}
        role="button"
        onClick={(e) => {
          setDropdownVisible(!isDropdownVisible)
          e.preventDefault()
        }}
      >
        {/* 🏳 */}
        &#127987;
      </a>
      {isDropdownVisible && (
        <div ref={dropdownRef} className="absolute left-10 top-0.5 flex h-96 gap-5">
          {/* Countries */}
          <div className="leaflet-bar box-content w-max rounded bg-tint-02/80 shadow-lg backdrop-blur-sm">
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
                  onChange={(e) => handleConSelectAll(e.target.checked)}
                />
              </div>
            </div>
            <div className="h-max overflow-y-auto">
              {Object.keys(db.filterBounds.locations)
                .sort()
                .map((country) => (
                  <div key={country} className="mx-1 flex items-center border-b py-1 last-of-type:border-0 hover:bg-tint-02">
                    <input
                      type="checkbox"
                      name={country}
                      id={country}
                      checked={!filters.hideCountries?.includes(country)}
                      onChange={(e) => handleConCheckboxChange(country, e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor={country} className="w-full">
                      {country}
                    </label>
                  </div>
                ))}
            </div>
          </div>
          {/* Departments */}
          <div className="leaflet-bar box-content w-max rounded bg-tint-02/80 shadow-lg backdrop-blur-sm">
            <div className="flex h-8 flex-row justify-between">
              <div className="m-1 text-base font-semibold">Departamentos</div>
              <div className="mx-1 flex flex-row justify-center align-middle">
                <label htmlFor="all" className="mx-2 mt-[5px]">
                  Seleccionar todo
                </label>
                <input
                  type="checkbox"
                  name="all"
                  checked={Object.keys(filters.hideDepartments).length === 0}
                  onChange={(e) => handleDepSelectAll(e.target.checked)}
                />
              </div>
            </div>
            <div className="h-[calc(100%-2rem)] overflow-y-auto px-1">
              {Object.entries(visibleDepartments)
                .sort(([country1, _], [country2, __]) => country1.localeCompare(country2))
                .map(([country, departments]) => (
                  <div key={country}>
                    <span className="font-bold">{country}</span>
                    {Object.keys(departments).map((department) => (
                      <div key={department} className="flex items-center border-b border-b-tint-01 p-1 last-of-type:border-0 hover:bg-tint-02">
                        <input
                          type="checkbox"
                          name={department}
                          id={department}
                          checked={!filters.hideDepartments?.includes(`${country} - ${department}`)}
                          onChange={(e) => handleDepCheckboxChange(country, department, e.target.checked)}
                          className="mr-2"
                        />
                        <label htmlFor={department} className="w-full">
                          {department}
                        </label>
                      </div>
                    ))}
                    <hr />
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default CountryControl
