// import { useEffect } from 'react'
// import { useMap } from 'react-leaflet'
// import LControlSearch from 'leaflet-search'

// interface SearchControlProps {
//   // A reference to a LayerGroup in leaflet
//   layerRef: React.MutableRefObject<any>
// }

// const SearchControl: React.FC<SearchControlProps> = ({ layerRef }) => {
//   const map = useMap()

//   useEffect(() => {
//     if (layerRef.current) {
//       const searchControl = new LControlSearch({
//         textPlaceholder: 'Search Stakeholders by name...',
//         position: 'topleft',
//         layer: layerRef.current,
//         initial: false,
//         zoom: 12,
//         marker: false,
//         autoCollapse: true, // Auto collapse search control on result select
//       })

//       // Listen for the search:locationfound event
//       searchControl.on('search:locationfound', (e: any) => {
//         // Simulate a click on the marker when a location is found
//         e.layer.fire('click')
//       })
//       map.addControl(searchControl)

//       return () => {
//         map.removeControl(searchControl)
//       }
//     }
//   }, [layerRef])

//   return null
// }

// export default SearchControl
