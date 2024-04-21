import React, { useState, useEffect } from 'react'
import 'leaflet/dist/leaflet.css'
import { GeocodingApi, Configuration, PeliasLayer, PeliasGeoJSONFeature, AutocompleteRequest } from '@stadiamaps/api'

interface HomeProps {
  layers: PeliasLayer[]
  setStringValue: (val: string) => void
  setBounds: (bound: number[] | undefined) => void
  setCountryCode?: (code: string) => void
  countryCode?: string
  department?: { name: string; bbox: number[] }
}

const stadiaAPIKey = import.meta.env.VITE_STADIA_KEY
const api = new GeocodingApi(new Configuration({ apiKey: stadiaAPIKey }))

const AutocompleteSearch: React.FC<HomeProps> = ({ layers, setStringValue, setBounds, setCountryCode, countryCode, department }) => {
  const [search, setSearch] = useState<string>('')

  const [options, setOptions] = useState<PeliasGeoJSONFeature[]>([])

  const [isLoading, setIsLoading] = useState(true)

  const [localStrVal, setLocalStrVal] = useState<string>('')

  const [queryDebounce, setQueryDebounce] = useState<NodeJS.Timeout | null>(null)

  function getName(feat: PeliasGeoJSONFeature) {
    let val = feat.properties?.label || ''
    let end = val.indexOf(',')
    if (end != -1) val = val.slice(0, end)
    return val
  }

  function handleSelect(feat: PeliasGeoJSONFeature) {
    let val = getName(feat)
    setSearch(val)
    setStringValue(val)
    setLocalStrVal(val)
    if (setCountryCode !== undefined) setCountryCode(feat.properties?.country_a || '')
    setBounds(feat.bbox)
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
        const q: AutocompleteRequest = { text: search, layers: layers }
        if (countryCode) {
          q.boundaryCountry = [countryCode]
        }
        if (department) {
          q.boundaryRectMinLon = department.bbox[0]
          q.boundaryRectMinLat = department.bbox[1]
          q.boundaryRectMaxLon = department.bbox[2]
          q.boundaryRectMaxLat = department.bbox[3]
        }
        const response = await api.autocomplete(q)
        let feats = response.features
        if (department) {
          feats = feats.filter((feat) => feat.properties?.region == department.name)
        }
        setOptions(feats)
        setIsLoading(false)
      }, 400)
    )
  }, [search])

  return (
    <div>
      <input
        type="text"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value)
          setStringValue('')
          setLocalStrVal('')
          setBounds(undefined)
          if (setCountryCode !== undefined) setCountryCode('')
        }}
        className="w-2/3"
      />
      {localStrVal && <p className="ml-2 inline-block text-xl text-[#00ad2b]">✓</p>}
      {isLoading && <p>Loading...</p>}
      {!isLoading && options.length != 0 && (
        <ul className="max-h-20 w-2/3 overflow-y-scroll bg-white">
          {options.map((option) => {
            return (
              <li key={option.properties?.gid} onClick={() => handleSelect(option)} className="hover:cursor-pointer hover:bg-tint-02">
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
