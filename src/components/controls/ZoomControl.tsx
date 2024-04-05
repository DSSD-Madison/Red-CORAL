import { useMap } from 'react-leaflet'
import Control from 'react-leaflet-custom-control'
import { MarkerFilters } from 'types'

interface ZoomControlProps {
  zoomInTitle?: string
  zoomOutTitle?: string
  zoomResetTitle?: string
  zoomLevel: number
  setFilters: React.Dispatch<React.SetStateAction<MarkerFilters>>
}

function ZoomControl(props: ZoomControlProps) {
  const { zoomInTitle, zoomResetTitle, zoomOutTitle, setFilters } = props

  const map = useMap()

  return (
    <Control position="topleft">
      <div className="leaflet-bar">
        <a
          className="leaflet-control-zoom-in"
          title={zoomInTitle}
          role="button"
          onClick={(e) => {
            map.zoomIn()
            e.preventDefault()
          }}
        >
          +
        </a>
        <a
          className="leaflet-control-zoom-out"
          title={zoomOutTitle}
          role="button"
          onClick={(e) => {
            map.zoomOut()
            e.preventDefault()
          }}
        >
          -
        </a>
        <a
          className="leaflet-control-zoom-out pt-[2px]"
          title={zoomResetTitle}
          role="button"
          onClick={(e) => {
            map.setView([-27, -60], 3.5)
            setFilters({
              hideCategories: [],
              hideTypes: [],
              startYear: null,
              endYear: null,
            })
            e.preventDefault()
          }} // circle arrow symbol
        >
          &#x21ba;
        </a>
      </div>
    </Control>
  )
}

ZoomControl.defaultProps = {
  zoomInTitle: 'Acercar',
  zoomOutTitle: 'Alejar',
  zoomResetTitle: 'Restablecer',
}

export default ZoomControl
