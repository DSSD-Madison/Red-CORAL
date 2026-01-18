import React, { useEffect, useReducer, useState, useCallback } from 'react'
import { useDB } from '@/context/DBContext'
import { formatDuration } from '@/utils'
import { filterReducer, initialFilterState } from '@/filters/filterReducer'
import { publishData, getLastPublishTime, countIncidentsToPublish } from '@/utils/publish'
import { LucideUploadCloud, LucideEye, LucideFileCheck2, LucideFileInput, LucideFileOutput } from 'lucide-react'
import StatisticsFilterBarContents from '@/components/StatisticsFilterBarContents'
import ResetFilters from '@/components/filters/ResetFilters'

const PUBLISH_FILTER_STORAGE_KEY = 'publishFilterState'
const STATS_FILTER_STORAGE_KEY = 'filterState'

function getPublishFilterState() {
  try {
    const local = localStorage.getItem(PUBLISH_FILTER_STORAGE_KEY)
    if (local) {
      return JSON.parse(local)
    }
  } catch (e) {
    console.error(e)
    localStorage.removeItem(PUBLISH_FILTER_STORAGE_KEY)
  }
  return initialFilterState(0) // Use a different seed if needed, but 0 is fine
}

const PublishAdmin: React.FC = () => {
  const { firestore, storage, isLoading: isDBLoading } = useDB()
  const [filters, dispatchFilters] = useReducer(filterReducer, getPublishFilterState())
  const [lastPublishTimestamp, setLastPublishTimestamp] = useState<string | null>(null)
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null)
  const [incidentCount, setIncidentCount] = useState<number | null>(null)
  const [isCounting, setIsCounting] = useState(false)
  const [copiedToStats, setCopiedToStats] = useState(false)
  const [copiedFromStats, setCopiedFromStats] = useState(false)

  // Save filter state to local storage
  useEffect(() => {
    localStorage.setItem(PUBLISH_FILTER_STORAGE_KEY, JSON.stringify(filters))
  }, [filters])

  // Fetch last publish time on mount
  useEffect(() => {
    getLastPublishTime(storage)
      .then(setLastPublishTimestamp)
      .catch((err) => {
        console.error('Failed to get last publish time:', err)
        setPublishError('No se pudo obtener la hora de la última publicación.') // Use publishError
      })
  }, [storage])

  const handlePublish = useCallback(async () => {
    setIsPublishing(true)
    setPublishError(null)
    setPublishSuccess(null)
    setIncidentCount(null) // Reset count on new publish attempt
    try {
      const newTimestamp = await publishData(firestore, storage, filters.filters)
      setLastPublishTimestamp(newTimestamp)
      setPublishSuccess(`Publicado con éxito a las ${new Date(newTimestamp).toLocaleTimeString()}`)
    } catch (error: any) {
      console.error('Publishing failed:', error)
      setPublishError(`Error al publicar: ${error.message || 'Unknown error'}`)
    } finally {
      setIsPublishing(false)
    }
  }, [firestore, storage, filters])

  const handlePreviewCount = useCallback(async () => {
    setIsCounting(true)
    setIncidentCount(null)
    setPublishError(null) // Clear previous errors
    try {
      const count = await countIncidentsToPublish(firestore, filters.filters)
      setIncidentCount(count)
    } catch (error: any) {
      console.error('Counting failed:', error)
      setPublishError(`Error al contar: ${error.message || 'Unknown error'}`)
    } finally {
      setIsCounting(false)
    }
  }, [firestore, filters])

  const handleCopyToStats = () => {
    setPublishError(null) // Clear previous errors
    localStorage.setItem(STATS_FILTER_STORAGE_KEY, JSON.stringify(filters))
    setCopiedToStats(true)
    setTimeout(() => setCopiedToStats(false), 1500) // Reset icon after 1.5s
  }

  const handleCopyFromStats = () => {
    setPublishError(null) // Clear previous errors
    try {
      const statsFilters = localStorage.getItem(STATS_FILTER_STORAGE_KEY)
      if (statsFilters) {
        dispatchFilters({ type: 'REPLACE_STATE', payload: JSON.parse(statsFilters) })
        setCopiedFromStats(true)
        setTimeout(() => setCopiedFromStats(false), 1500) // Reset icon after 1.5s
      } else {
        setPublishError('No se encontraron filtros guardados en Estadísticas.')
      }
    } catch (e) {
      console.error('Failed to copy filters from stats:', e)
      setPublishError('No se pudieron copiar los filtros del panel de estadísticas.')
    }
  }

  const lastPublishDate = lastPublishTimestamp ? new Date(lastPublishTimestamp) : null
  const dbDiffString = lastPublishDate ? formatDuration(lastPublishDate.getTime()) : 'nunca'

  return (
    <div className="flex min-h-full flex-col gap-2 bg-slate-200 p-4">
      <div className="flex flex-row items-center gap-2">
        <h1 className="self-start text-2xl font-semibold">Publicar Datos Públicos</h1>
        <div className="flex-grow" />
        <a href="https://madison.dssdglobal.org/" target="_blank" rel="noopener noreferrer">
          <img src="dssd_logo.svg" alt="DSSD logo" height={75} width={75} />
        </a>
        <img src="/banner.png" alt="Red CORAL logo" className="w-full max-w-64" />
      </div>

      <div className="rounded-lg bg-white p-4 shadow">
        <p>Esta página permite publicar una versión filtrada de los datos de incidentes para el acceso público.</p>
        <p>
          Los filtros aplicados a continuación determinarán qué incidentes se incluyen en el archivo{' '}
          <code className="rounded bg-slate-100">state.json</code> publicado.
        </p>
        <p className="mt-4 text-sm text-gray-600">
          Última publicación hace <span className="font-semibold">{dbDiffString}</span>.
        </p>
      </div>

      <div className="flex w-full flex-wrap items-center justify-start gap-2 overflow-x-auto rounded-md bg-white px-2 py-2 text-sm shadow">
        <StatisticsFilterBarContents filters={filters.filters} dispatchFilters={dispatchFilters} />
        <div className="flex-grow" />
        <ResetFilters dispatch={dispatchFilters} />
        <button
          onClick={handleCopyFromStats}
          title="Copiar filtros DESDE Estadísticas"
          className="ml-2 text-sm text-gray-600 disabled:opacity-50"
          disabled={isPublishing || isCounting}
        >
          <span className="flex items-center gap-1">
            {copiedFromStats ? <LucideFileCheck2 size={16} className="text-green-600" /> : <LucideFileInput size={16} />} De Estadísticas
          </span>
        </button>
        <button
          onClick={handleCopyToStats}
          title="Copiar filtros HACIA Estadísticas"
          className="ml-2 text-sm text-gray-600 disabled:opacity-50"
          disabled={isPublishing || isCounting}
        >
          <span className="flex items-center gap-1">
            {copiedToStats ? <LucideFileCheck2 size={16} className="text-green-600" /> : <LucideFileOutput size={16} />} A Estadísticas
          </span>
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2 rounded-lg bg-white p-4 shadow">
        <button
          onClick={handlePreviewCount}
          disabled={isPublishing || isDBLoading || isCounting}
          className="flex items-center gap-1 rounded border border-gray-400 bg-gray-100 px-3 py-1 hover:bg-gray-200 disabled:opacity-50"
        >
          <LucideEye size={16} />
          {isCounting ? 'Contando...' : 'Contar'}
        </button>
        {incidentCount !== null && <span className="text-sm text-gray-700">({incidentCount})</span>}
        <button
          onClick={handlePublish}
          disabled={isPublishing || isDBLoading || isCounting}
          className="flex items-center gap-1 rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <LucideUploadCloud size={16} />
          {isPublishing ? 'Publicando...' : 'Publicar'}
        </button>
      </div>

      {/* Status Messages */}
      {publishSuccess && <div className="rounded border border-green-400 bg-green-100 p-2 text-sm text-green-800">{publishSuccess}</div>}
      {publishError && <div className="rounded border border-red-400 bg-red-100 p-2 text-sm text-red-800">{publishError}</div>}
    </div>
  )
}

export default PublishAdmin
