import { filterProps } from '@/pages/StatsDashboard'
import BaseFilter from './BaseFilter'
import { LucideTags, LucideTrash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Incident } from '@/types'

const CategoryFilter = ({ id, data, dispatch }: filterProps) => {
  const [hiddenCategories, setHiddenCategories] = useState<string[]>([])
  const [hiddenTypes, setHiddenTypes] = useState<string[]>([])

  const typesByCategory = useMemo(() => {
    return Object.entries(data.Types).reduce(
      (acc, [typeID, type]) => {
        if (!acc[type.categoryID]) {
          acc[type.categoryID] = []
        }
        acc[type.categoryID].push({ typeID, name: type.name })
        return acc
      },
      {} as { [key: string]: { typeID: string; name: string }[] }
    )
  }, [data.Types])

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
      setHiddenCategories(Object.keys(data.Categories))
      setHiddenTypes(Object.keys(data.Types))
    }
  }

  const applyFilters = () => {
    const incidentNotHidden = (incident: Incident) =>
      !hiddenCategories.includes(data.Types[incident.typeID as string].categoryID as string) && !hiddenTypes.includes(incident.typeID as string)

    dispatch({
      type: 'UPDATE_FILTER',
      payload: {
        id: id,
        operation: incidentNotHidden,
      },
    })
  }

  const removeThisFilter = () => {
    dispatch({ type: 'REMOVE_FILTER', payload: { id: id } })
  }

  const filterString = []
  if (hiddenCategories.length === 1) {
    filterString.push(`1 categoría oculta`)
  } else if (hiddenCategories.length > 1) {
    filterString.push(`${hiddenCategories.length} categorías ocultas`)
  }
  if (hiddenTypes.length === 1) {
    filterString.push(`1 tipo oculto`)
  } else if (hiddenTypes.length > 1) {
    filterString.push(`${hiddenTypes.length} tipos ocultos`)
  }
  if (filterString.length === 0) {
    filterString.push('ningún filtro aplicado')
  }

  return (
    <BaseFilter icon={<LucideTags />} text={'Categorías: ' + filterString.join(', ')} scrollOverflow={true}>
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
        {Object.entries(data.Categories).map(([categoryID, category]) => (
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
        <button onClick={applyFilters} className="mt-4 rounded bg-blue-500 px-2 py-1 text-white">
          Aplicar
        </button>
      </div>
    </BaseFilter>
  )
}

export default CategoryFilter
