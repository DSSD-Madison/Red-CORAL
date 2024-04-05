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

  return (
    <Control prepend position="topleft">
      <div className="leaflet-bar relative rounded font-proxima-nova">
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
          <div
            ref={dropdownRef}
            className="absolute left-10 top-0 box-border w-60 rounded border-2 border-shade-01 border-opacity-40 bg-white bg-opacity-90"
          >
            <div className="flex flex-row justify-between">
              <div className="text-md m-1 font-semibold">Actividades</div>
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
                <div key={id} className="flex items-center border-b border-b-tint-01 p-1 last-of-type:border-0 hover:bg-tint-02">
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
      </div>
    </Control>
  )
}

export default CategoryControl
