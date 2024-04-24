import AutocompleteSearch from 'components/AutocompleteSearch'
import { useState, useEffect } from 'react'
import { useMap } from 'react-leaflet'
import { LatLngBoundsExpression, LatLngTuple } from 'leaflet'

const SearchControl: React.FC<{}> = () => {
  const map = useMap()
  const [bounds, setBounds] = useState<number[] | undefined>(undefined)

  useEffect(() => {
    if (bounds) {
      const boundsExp: LatLngBoundsExpression = [bounds.slice(0, 2).reverse() as LatLngTuple, bounds.slice(2).reverse() as LatLngTuple]
      map.flyToBounds(boundsExp, { paddingTopLeft: [300, 0], duration: 3, easeLinearity: 0.5 })
    }
  }, [bounds])

  return (
    <div className="leaflet-bar relative w-fit rounded">
      <div className="w-30 bg-gray-200 rounded p-2">
        <label>
          Buscar un lugar:
          <AutocompleteSearch setBounds={setBounds} />
        </label>
      </div>
    </div>
  )
}

export default SearchControl
