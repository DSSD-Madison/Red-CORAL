import { LucideRotateCcw } from 'lucide-react'
import { filterDispatchType } from '@/filters/filterReducer'

const ResetFilters = ({ dispatch }: { dispatch: React.Dispatch<filterDispatchType> }) => {
  return (
    <div onClick={() => dispatch({ type: 'RESET_FILTERS' })} className="cursor-pointer text-sm text-gray-600">
      <span className="flex items-center">
        <LucideRotateCcw size={16} strokeWidth={1} className="mr-1" />
        Resetear Filtros
      </span>
    </div>
  )
}

export default ResetFilters
