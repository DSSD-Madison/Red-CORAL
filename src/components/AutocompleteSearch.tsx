import React, { useState, useEffect } from 'react'
import 'leaflet/dist/leaflet.css'
import { GeocodingApi, Configuration, PeliasLayer, PeliasGeoJSONFeature, AutocompleteRequest } from '@stadiamaps/api'
import { ADDITIONAL_FEATURES } from '../constants'
import { LucideCheck, LucideLoader2, LucidePencil } from 'lucide-react'

interface HomeProps {
  layers?: PeliasLayer[]
  setStringValue?: (val: string) => void
  setBounds: (bound: number[] | undefined) => void
  setCountryCode?: (code: string) => void
  countryCode?: string
  department?: { name: string; bbox: number[] | undefined }
  initialValue?: string
}

const stadiaAPIKey = import.meta.env.VITE_STADIA_KEY
const api = new GeocodingApi(new Configuration({ apiKey: stadiaAPIKey }))

const AutocompleteSearch: React.FC<HomeProps> = ({ layers, setStringValue, setBounds, setCountryCode, countryCode, department, initialValue }) => {
  const [search, setSearch] = useState<string>(initialValue || '')

  const [options, setOptions] = useState<PeliasGeoJSONFeature[]>([])

  const [isLoading, setIsLoading] = useState(true)

  const [localStrVal, setLocalStrVal] = useState<string>('')

  const [queryDebounce, setQueryDebounce] = useState<NodeJS.Timeout | null>(null)

  const inputRef = React.useRef<HTMLInputElement>(null)

  function getName(feat: PeliasGeoJSONFeature) {
    if (!countryCode && !department) return feat.properties?.name || feat.properties?.label || ''
    let val = feat.properties?.name || feat.properties?.label || ''
    let end = val.indexOf(',')
    if (end != -1) val = val.slice(0, end)
    return val
  }

  function handleSelect(feat: PeliasGeoJSONFeature) {
    let val = getName(feat)
    setSearch(val)
    if (setStringValue !== undefined) setStringValue(val)
    setLocalStrVal(val)
    if (setCountryCode !== undefined) setCountryCode(feat.properties?.country_a || '')
    if (!layers?.includes('country') && !feat.bbox) {
      alert('Stadia Maps no tiene información de ubicación para este municipio. No podrás acercarlo automáticamente.')
    }
    setBounds(feat.bbox)
    setOptions([])
  }

  function isMatch(feat: PeliasGeoJSONFeature, search: string) {
    const normalizedSearch = search.toLowerCase()
    const normalizedLabel = feat.properties?.label?.toLowerCase()
    return normalizedLabel?.includes(normalizedSearch) || false
  }

  async function getFeats(search: string) {
    const q: AutocompleteRequest = { text: search, lang: 'es-CO' }
    if (layers) q.layers = layers
    if (countryCode && (countryCode == 'custom' || countryCode == 'world')) {
      return []
    }
    if (countryCode) {
      q.boundaryCountry = [countryCode]
    }
    if (department && department.bbox) {
      q.boundaryRectMinLon = department.bbox[0]
      q.boundaryRectMinLat = department.bbox[1]
      q.boundaryRectMaxLon = department.bbox[2]
      q.boundaryRectMaxLat = department.bbox[3]
    }
    const response = await api.autocomplete(q)
    let feats = response.features
    if (layers?.includes('country')) {
      feats.push(...ADDITIONAL_FEATURES.filter((feat) => isMatch(feat, search)))
    }
    if (department) {
      feats = feats.filter((feat) => feat.properties?.region == department.name)
    }
    return feats
  }

  useEffect(() => {
    if (countryCode === 'custom') {
      setIsLoading(false)
      return
    }
    if (search.length < 1 || search == localStrVal) {
      setOptions([])
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    if (queryDebounce) {
      clearTimeout(queryDebounce)
    }
    setQueryDebounce(
      setTimeout(async () => {
        const feats = await getFeats(search)
        setOptions(feats)
        setIsLoading(false)
      }, 400)
    )
  }, [search])

  return (
    <form
      className="relative mb-2"
      onSubmit={(e) => {
        // take user input instead of suggestion on enter (if user wants to input something that isn't in the suggestions)
        const input = inputRef.current ? inputRef.current.value : ''
        setLocalStrVal(input)
        if (setStringValue !== undefined) setStringValue(input)
        if (setCountryCode !== undefined) setCountryCode('custom')
        e.preventDefault()
      }}
    >
      <input
        type="text"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value)
          if (setStringValue !== undefined) setStringValue('')
          setLocalStrVal('')
          setBounds(undefined)
          if (setCountryCode !== undefined) setCountryCode('')
        }}
        ref={inputRef}
        className={`w-full border border-tint-02 p-2 ${options.length != 0 ? 'rounded-t-md' : 'rounded-md'}`}
      />
      <div className="absolute right-2 top-2 flex">
        {localStrVal && <LucideCheck size={20} className="text-[#00ad2b]" />}
        {countryCode == 'custom' && (
          <LucidePencil size={20} className="text-[#00ad2b]">
            <title>Entrada personalizada: no habrá autocompletado</title>
          </LucidePencil>
        )}
      </div>
      {isLoading && (
        <p className="rounded-b-md bg-white/70 p-2">
          <LucideLoader2 className="animate-spin" size={20}></LucideLoader2>
        </p>
      )}
      {!isLoading && options.length != 0 && (
        <ul className="max-h-32 w-full overflow-y-auto rounded-b-md bg-white/70">
          {options.map((option) => {
            return (
              <li
                key={option.properties?.gid}
                onClick={() => handleSelect(option)}
                className="border-gray-500 p-2 hover:cursor-pointer hover:bg-white not-last:border-b"
              >
                {getName(option)}
              </li>
            )
          })}
        </ul>
      )}
    </form>
  )
}

export default AutocompleteSearch
