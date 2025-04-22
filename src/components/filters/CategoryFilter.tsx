import { filterProps } from '@/filters/filterReducer'
import BaseFilter from './BaseFilter'
import { LucideTags } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useDB } from '@/context/DBContext'
import { typesByCategory } from '@/utils'

interface CategoryFilterState extends filterProps {
  state?: {
    hiddenCategories: string[]
    hiddenTypes: string[]
  }
}

const CategoryFilter = ({ id, dispatch, state }: CategoryFilterState) => {
  const { db } = useDB()
  const [hiddenCategories, setHiddenCategories] = useState<string[]>(state?.hiddenCategories || [])
  const [hiddenTypes, setHiddenTypes] = useState<string[]>(state?.hiddenTypes || [])

  const typesByCategoryOut = useMemo(() => typesByCategory(db), [db.Types])

  const handleCategoryChange = (categoryID: string, makeVisible: boolean) => {
    // Clobber the state of its descendants
    setHiddenTypes((prev) => prev.filter((t) => !typesByCategoryOut[categoryID]?.some(({ typeID }) => typeID === t)))
    // Set the state of the category
    setHiddenCategories((prev) => (makeVisible ? prev.filter((c) => c !== categoryID) : [...prev, categoryID]))
  }

  const handleTypeChange = (categoryID: string, typeID: string, makeVisible: boolean) => {
    // If trying to show a type, ensure its category is visible, but hide all other types in it
    if (makeVisible && hiddenCategories.includes(categoryID)) {
      handleCategoryChange(categoryID, true)
      setHiddenTypes((prev) => [...prev, ...typesByCategoryOut[categoryID].map((t) => t.typeID)])
    }
    // If all types are hidden, hide the category instead
    const typesInCategory = typesByCategoryOut[categoryID]?.map((t) => t.typeID) || []
    const hiddenTypesInCategory = hiddenTypes.filter((t) => typesInCategory.includes(t))
    if (!makeVisible && hiddenTypesInCategory.length + 1 === typesInCategory.length) {
      handleCategoryChange(categoryID, false)
    } else {
      setHiddenTypes((prev) => (makeVisible ? prev.filter((t) => t !== typeID) : [...prev, typeID]))
    }
  }

  const selectAllCategories = (selectAll: boolean) => {
    if (selectAll) {
      setHiddenCategories([])
      setHiddenTypes([])
    } else {
      setHiddenCategories(Object.keys(db.Categories))
      setHiddenTypes(Object.keys(db.Types))
    }
  }

  const parts: string[] = []

  if (hiddenCategories.length > 0) {
    parts.push(hiddenCategories.length === 1 ? '1 categoría oculta' : `${hiddenCategories.length} categorías ocultas`)
  }

  if (hiddenTypes.length > 0) {
    parts.push(hiddenTypes.length === 1 ? '1 tipo oculto' : `${hiddenTypes.length} tipos ocultos`)
  }

  const filterStringDisplay = parts.length ? `: ${parts.join(', ')}` : ''
  const sortedCategories = Object.entries(db.Categories).sort((a, b) => a[1].name.localeCompare(b[1].name))
  return (
    <BaseFilter icon={<LucideTags />} text={'Categorías' + filterStringDisplay} scrollOverflow={true} dispatch={dispatch} id={id}>
      <div className="p-2">
        <button onClick={() => selectAllCategories(true)} className="mb-2 mr-2 rounded bg-neutral-500 px-2 py-1 text-white">
          Seleccionar todo
        </button>
        <button onClick={() => selectAllCategories(false)} className="mb-2 rounded bg-neutral-500 px-2 py-1 text-white">
          Deseleccionar todo
        </button>
        {sortedCategories.map(([categoryID, category]) => (
          <details key={categoryID}>
            <summary>
              <input
                type="checkbox"
                checked={!hiddenCategories.includes(categoryID)}
                onChange={(e) => handleCategoryChange(categoryID, e.target.checked)}
                className="mr-2"
              />
              {category.name}
            </summary>
            <div className="pl-6">
              <ul>
                {typesByCategoryOut[categoryID]?.map(({ typeID, name: typeName }) => (
                  <li key={typeID}>
                    <input
                      type="checkbox"
                      checked={!hiddenCategories.includes(categoryID) && !hiddenTypes.includes(typeID)}
                      onChange={(e) => handleTypeChange(categoryID, typeID, e.target.checked)}
                      className="mr-2"
                    />
                    {typeName}
                  </li>
                ))}
              </ul>
            </div>
          </details>
        ))}
        <button
          onClick={() =>
            dispatch({
              type: 'UPDATE_FILTER',
              payload: {
                id: id,
                state: { hiddenCategories, hiddenTypes },
              },
            })
          }
          className="mt-4 rounded bg-blue-500 px-2 py-1 text-white"
        >
          Aplicar
        </button>
      </div>
    </BaseFilter>
  )
}

export default CategoryFilter
