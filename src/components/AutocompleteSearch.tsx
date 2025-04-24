import React, { useState, useEffect } from 'react'
import 'leaflet/dist/leaflet.css'
import { GeocodingApi, Configuration, PeliasLayer, PeliasGeoJSONFeature, AutocompleteRequest } from '@stadiamaps/api'
import { ADDITIONAL_FEATURES } from '../constants'

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
    if (countryCode && countryCode != 'world') {
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
    <div className="relative mb-2">
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
        className="w-full rounded-md border border-tint-02 p-2"
      />
      {localStrVal && <p className="absolute right-2 top-1 text-xl text-[#00ad2b]">✓</p>}
      {isLoading && <p className="text-center">Loading...</p>}
      {!isLoading && options.length != 0 && (
        <ul className="mt-1 max-h-32 w-full overflow-y-scroll rounded-md bg-white/70">
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
    </div>
  )
}

export default AutocompleteSearch
