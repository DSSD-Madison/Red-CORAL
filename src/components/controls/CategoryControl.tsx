import { useEffect, useRef, useState } from 'react'

import Control from 'react-leaflet-custom-control'
import { DB, MarkerFilters } from 'types'

interface TagControlProps {
  data: DB
  filters: MarkerFilters
  setFilters: React.Dispatch<React.SetStateAction<MarkerFilters>>
}

const CategoryControl: React.FC<TagControlProps> = ({ data, filters, setFilters }) => {
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

  const handleCategoryCheckboxChange = (id: string, checked: boolean) => {
    console.log('handleCategoryCheckboxChange', id, checked)
    if (checked) {
      setFilters((filters) => ({
        ...filters,
        hideCategories: filters.hideCategories.filter((catID) => catID !== id),
      }))
    } else {
      setFilters((filters) => ({
        ...filters,
        hideCategories: [...filters.hideCategories, id],
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

  return (
    <Control prepend position="topleft">
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
          <div ref={dropdownRef} className="leaflet-bar absolute -top-0.5 left-10 box-content h-96 w-60 rounded bg-tint-02/60 shadow-lg">
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
        )}
        {/* Incident types */}
        {isDropdownVisible && (
          <div ref={dropdownRef} className="leaflet-bar absolute -top-0.5 left-72 box-content h-96 w-80 rounded bg-tint-02/60 shadow-lg">
            <div className="flex h-8 flex-row justify-between">
              <div className="m-1 text-base font-semibold">Tipos de eventos</div>
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
            <div className="h-[calc(100%-2rem)] overflow-y-auto px-1">
              {Object.entries(data.Categories).map(([catID, { name: catName }]) => (
                <div key={catID}>
                  {catName}
                  {typesByCategory[catID]?.map(({ typeID, name: typeName }) => (
                    <div key={typeID} className="flex items-center border-b border-b-tint-01 p-1 last-of-type:border-0 hover:bg-tint-02">
                      <input
                        type="checkbox"
                        name={typeID}
                        id={typeID}
                        checked={!filters.hideCategories?.includes(typeID)}
                        onChange={(e) => handleCategoryCheckboxChange(typeID, e.target.checked)}
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
        )}
      </div>
    </Control>
  )
}

export default CategoryControl
