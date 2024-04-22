import React, { useEffect, useRef, useState } from 'react'
import { DB, MarkerFilters } from 'types'

interface YearControlProps {
  data: DB
  filters: MarkerFilters
  setFilters: React.Dispatch<React.SetStateAction<MarkerFilters>>
}

const CategoryControl: React.FC<YearControlProps> = ({ data, filters, setFilters }) => {
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

  const typesByCategory = Object.entries(data.Types).reduce(
    (acc, [typeID, type]) => {
      if (!acc[type.categoryID]) {
        acc[type.categoryID] = []
      }
      acc[type.categoryID].push({ typeID, name: type.name })
      return acc
    },
    {} as { [key: string]: { typeID: string; name: string }[] }
  )

  const handleCategoryCheckboxChange = (id: string, checked: boolean) => {
    if (checked) {
      setFilters((filters) => ({
        ...filters,
        hideCategories: filters.hideCategories.filter((catID) => catID !== id),
      }))
    } else {
      setFilters((filters) => ({
        ...filters,
        hideCategories: [...filters.hideCategories, id],
        // When a category is filtered out, reset any subtypes that we were already filtering
        hideTypes: filters.hideTypes.filter((typeID) => !typesByCategory[id].map((e) => e.typeID).includes(typeID as string)),
      }))
    }
  }

  const handleCategorySelectAll = (checked: boolean) => {
    if (checked) {
      setFilters((filters) => ({
        ...filters,
        hideCategories: [],
      }))
    } else {
      setFilters((filters) => ({
        ...filters,
        hideCategories: Object.keys(data.Categories),
      }))
    }
  }

  const handleTypeCheckboxChange = (id: string, checked: boolean) => {
    if (checked) {
      setFilters((filters) => ({
        ...filters,
        hideTypes: filters.hideTypes.filter((typeID) => typeID !== id),
      }))
    } else {
      setFilters((filters) => ({
        ...filters,
        hideTypes: [...filters.hideTypes, id],
      }))
    }
  }

  const handleTypeSelectAll = (checked: boolean) => {
    if (checked) {
      setFilters((filters) => ({
        ...filters,
        hideTypes: [],
      }))
    } else {
      setFilters((filters) => ({
        ...filters,
        // Only hide subtypes of visible categories
        hideTypes: Object.entries(typesByCategory)
          .filter(([catID]) => !filters.hideCategories.includes(catID))
          .flatMap(([_, value]) => value.map((e) => e.typeID)),
      }))
    }
  }

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
        {/* ☰ */}
        &#x2630;
      </a>
      {isDropdownVisible && (
        <div ref={dropdownRef} className="absolute -top-0.5 left-10 flex h-96 gap-5">
          <div className="leaflet-bar box-content w-60 rounded bg-tint-02/80 shadow-lg backdrop-blur-sm">
            <div className="flex flex-row justify-between">
              <div className="m-1 text-base font-semibold">Actividades</div>
              <div className="mx-1 flex flex-row justify-center align-middle">
                <label htmlFor="all" className="mx-2 mt-[5px]">
                  Seleccionar todo
                </label>
                <input
                  type="checkbox"
                  name="all"
                  checked={Object.keys(filters.hideCategories).length === 0}
                  onChange={(e) => handleCategorySelectAll(e.target.checked)}
                />
              </div>
            </div>
            <div className="h-max overflow-y-auto">
              {Object.entries(data.Categories).map(([id, { name, color }]) => (
                <div key={id} className="mx-1 flex items-center border-b py-1 last-of-type:border-0 hover:bg-tint-02">
                  <input
                    type="checkbox"
                    name={id}
                    id={id}
                    checked={!filters.hideCategories?.includes(id)}
                    onChange={(e) => handleCategoryCheckboxChange(id, e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor={id} className="w-full">
                    {name}
                  </label>
                  <div className="ml-auto h-4 w-4 flex-shrink-0 rounded-full border border-harvard-slate" style={{ backgroundColor: color }} />
                </div>
              ))}
            </div>
          </div>
          {/* Event Subtypes */}
          <div className="leaflet-bar box-content w-80 rounded bg-tint-02/80 shadow-lg backdrop-blur-sm">
            <div className="flex h-8 flex-row justify-between">
              <div className="m-1 text-base font-semibold">Tipos de eventos</div>
              <div className="mx-1 flex flex-row justify-center align-middle">
                <label htmlFor="all" className="mx-2 mt-[5px]">
                  Seleccionar todo
                </label>
                <input
                  type="checkbox"
                  name="all"
                  checked={Object.keys(filters.hideTypes).length === 0}
                  onChange={(e) => handleTypeSelectAll(e.target.checked)}
                />
              </div>
            </div>
            <div className="h-[calc(100%-2rem)] overflow-y-auto px-1">
              {Object.entries(data.Categories)
                .filter(([catID]) => !filters.hideCategories.includes(catID))
                .map(([catID, { name: catName }]) => (
                  <div key={catID}>
                    {catName}
                    {typesByCategory[catID]?.map(({ typeID, name: typeName }) => (
                      <div key={typeID} className="flex items-center border-b border-b-tint-01 p-1 last-of-type:border-0 hover:bg-tint-02">
                        <input
                          type="checkbox"
                          name={typeID}
                          id={typeID}
                          checked={!filters.hideTypes?.includes(typeID)}
                          onChange={(e) => handleTypeCheckboxChange(typeID, e.target.checked)}
                          className="mr-2"
                        />
                        <label htmlFor={typeID} className="w-full">
                          {typeName}
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
    </div>
  )
}

export default CategoryControl
