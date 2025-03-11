import { filterProps } from '@/filters/filterReducer'
import BaseFilter from './BaseFilter'
import { LucideTags, LucideTrash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useDB } from '@/context/DBContext'

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

  const typesByCategory = useMemo(() => {
    return Object.entries(db.Types).reduce(
      (acc, [typeID, type]) => {
        if (!acc[type.categoryID]) {
          acc[type.categoryID] = []
        }
        acc[type.categoryID].push({ typeID, name: type.name })
        return acc
      },
      {} as { [key: string]: { typeID: string; name: string }[] }
    )
  }, [db.Types])

  const handleCategoryChange = (categoryID: string, makeVisible: boolean) => {
    // Clobber the state of its descendants
    setHiddenTypes((prev) => prev.filter((t) => !typesByCategory[categoryID]?.some(({ typeID }) => typeID === t)))
    // Set the state of the category
    setHiddenCategories((prev) => (makeVisible ? prev.filter((c) => c !== categoryID) : [...prev, categoryID]))
  }

  const handleTypeChange = (categoryID: string, typeID: string, makeVisible: boolean) => {
    // If trying to show a type, ensure its category is visible, but hide all other types in it
    if (makeVisible && hiddenCategories.includes(categoryID)) {
      handleCategoryChange(categoryID, true)
      setHiddenTypes((prev) => [...prev, ...typesByCategory[categoryID].map((t) => t.typeID)])
    }
    // If all types are hidden, hide the category instead
    const typesInCategory = typesByCategory[categoryID]?.map((t) => t.typeID) || []
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

  const removeThisFilter = () => {
    dispatch({ type: 'REMOVE_FILTER', payload: { id: id } })
  }

  const parts: string[] = []

  if (hiddenCategories.length > 0) {
    parts.push(hiddenCategories.length === 1 ? '1 categoría oculta' : `${hiddenCategories.length} categorías ocultas`)
  }

  if (hiddenTypes.length > 0) {
    parts.push(hiddenTypes.length === 1 ? '1 tipo oculto' : `${hiddenTypes.length} tipos ocultos`)
  }

  const filterStringDisplay = parts.length ? `: ${parts.join(', ')}` : ''

  return (
    <BaseFilter icon={<LucideTags />} text={'Categorías' + filterStringDisplay} scrollOverflow={true}>
      <button onClick={removeThisFilter} className="absolute right-2 top-1 h-4 w-4 text-red-600" title="Eliminar Filtro">
        <LucideTrash2 size={20} />
      </button>
      <div className="p-2">
        <button onClick={() => selectAllCategories(true)} className="mb-2 mr-2 rounded bg-neutral-500 px-2 py-1 text-white">
          Seleccionar todo
        </button>
        <button onClick={() => selectAllCategories(false)} className="mb-2 mr-4 rounded bg-neutral-500 px-2 py-1 text-white">
          Deseleccionar todo
        </button>
        {Object.entries(db.Categories).map(([categoryID, category]) => (
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
            <div className="pl-4">
              <ul>
                {typesByCategory[categoryID]?.map(({ typeID, name: typeName }) => (
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
