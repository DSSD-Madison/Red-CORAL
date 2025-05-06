import { useDB } from '@/context/DBContext'
import { LucideTrash } from 'lucide-react'

interface ActivityTypeSelectorProps {
  categoryID: string | undefined
  typeID: string | undefined
  index: number
  onChangeCategory: (index: number, categoryID: string) => void
  onChangeType: (index: number, typeID: string) => void
  onRemove: (index: number) => void
  canRemove: boolean
}

const ActivityTypeSelector: React.FC<ActivityTypeSelectorProps> = ({
  categoryID,
  typeID,
  index,
  onChangeCategory,
  onChangeType,
  onRemove,
  canRemove,
}) => {
  const { db } = useDB()

  return (
    <div className="mb-2 rounded-md border border-neutral-400 bg-white/10 p-1">
      <label className="block text-sm font-medium text-shade-02">
        Actividad:
        <select
          value={categoryID}
          onChange={(e) => onChangeCategory(index, e.target.value)}
          className="mt-1 block w-full rounded-md bg-white p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="">
            <span role="img" aria-label="alert" className="mr-1">
              ⚠️
            </span>
            Por favor, elige una actividad
          </option>
          {Object.entries(db.Categories)
            .sort(([, a], [, b]) => a.name.localeCompare(b.name))
            .map(([id, category]) => (
              <option key={id} value={id}>
                {category.name}
              </option>
            ))}
        </select>
      </label>
      <label className="mt-2 block text-sm font-medium text-shade-02">
        Tipo de evento:
        <select
          value={typeID}
          onChange={(e) => onChangeType(index, e.target.value)}
          disabled={!categoryID}
          className="mt-1 block w-full rounded-md bg-white p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:opacity-50 sm:text-sm"
        >
          <option value="">
            <span role="img" aria-label="alert" className="mr-1">
              ⚠️
            </span>
            Por favor, elige un tipo de evento
          </option>
          {Object.entries(db.Types)
            .filter(([, type]) => type.categoryID === categoryID)
            .sort(([, a], [, b]) => a.name.localeCompare(b.name))
            .map(([id, type]) => (
              <option key={id} value={id}>
                {type.name}
              </option>
            ))}
        </select>
      </label>
      {canRemove && (
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="mt-2 rounded-sm border-0 bg-red-100 px-2 py-1 text-xs text-red-800 hover:bg-red-200"
        >
          <LucideTrash className="mr-1 inline h-4 w-4" />
          Quitar actividad
        </button>
      )}
    </div>
  )
}

export default ActivityTypeSelector
