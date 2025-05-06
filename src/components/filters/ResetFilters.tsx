import { LucideRotateCcw } from 'lucide-react'
import { filterDispatchType } from '@/filters/filterReducer'
import { useState } from 'react'

const ResetFilters = ({ dispatch }: { dispatch: React.Dispatch<filterDispatchType> }) => {
  const [arrowDeg, setArrowDeg] = useState(0)
  return (
    <button
      onClick={() => {
        dispatch({ type: 'RESET_FILTERS' })
        setArrowDeg((cur) => cur + 360)
      }}
      className="cursor-pointer text-sm text-gray-600"
    >
      <span className="flex items-center">
        <LucideRotateCcw
          size={16}
          strokeWidth={2}
          className="mr-1 transition-transform duration-500 ease-in-out"
          style={{ transform: `rotate(${-arrowDeg}deg)` }}
        />
        Resetear Filtros
      </span>
    </button>
  )
}

export default ResetFilters
