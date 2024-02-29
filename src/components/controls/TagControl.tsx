import { useEffect, useRef, useState } from 'react'

import Control from 'react-leaflet-custom-control'
import L from 'leaflet'
import { Stakeholder } from 'types'

interface TagControlProps {
  // A reference to a LayerGroup in leaflet
  layerRef: React.MutableRefObject<any>
  stakeholders: Stakeholder[]
}

const TagControl: React.FC<TagControlProps> = ({ layerRef, stakeholders }) => {
  const [isDropdownVisible, setDropdownVisible] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [tags, setTags] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  // must remove marker because setting layer opacity/interactivity does not prevent onclick
  const [removedMarkers, setRemovedMarkers] = useState<L.Marker[]>([])

  useEffect(() => {
    const allTags = [...new Set(stakeholders.map((s) => s.tags).flat())]
    setTags(allTags)
    setSelectedTags(allTags)
  }, [stakeholders])

  useEffect(() => {
    if (layerRef.current) {
      // names of all stakeholders with at least one tag in selectedTags
      const viewableStakeholderNames = stakeholders.filter((s) => s.tags.some((t) => selectedTags.includes(t))).map((s) => s.name)

      // add all previously removed markers
      removedMarkers.forEach((m) => m.addTo(layerRef.current))

      // get new list of removed markers
      let markersToRemove: L.Marker[] = []
      layerRef.current.eachLayer((layer: any) => {
        if (layer instanceof L.Marker && layer.options.title != undefined) {
          if (!viewableStakeholderNames.includes(layer.options.title)) {
            markersToRemove.push(layer)
          }
        }
      })

      // remove markers
      markersToRemove.forEach((m) => layerRef.current.removeLayer(m))
      setRemovedMarkers(markersToRemove)
    }
  }, [selectedTags])

  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setDropdownVisible(false)
    }
  }

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleCheckboxChange = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((item) => item !== tag))
    } else {
      setSelectedTags([...selectedTags, tag])
    }
  }

  return (
    <Control prepend position="topleft">
      <div className="leaflet-bar font-proxima-nova relative rounded">
        <a
          className="leaflet-control-zoom-in rounded"
          title={'Tags'}
          role="button"
          onClick={(e) => {
            setDropdownVisible(!isDropdownVisible)
            e.preventDefault()
          }}
        >
          {/* ☰ */}
          &#x2630;
        </a>
        {isDropdownVisible && (
          <div
            ref={dropdownRef}
            className="border-shade-01 absolute left-10 top-0 box-border w-40 rounded border-2 border-opacity-40 bg-white bg-opacity-90"
          >
            <div className="flex flex-row justify-between">
              <div className="text-md m-1 font-semibold">Tags</div>
              <div className="mx-1 flex flex-row justify-center align-middle">
                <label htmlFor="all" className="mx-2 mt-[5px]">
                  Select All
                </label>
                <input
                  type="checkbox"
                  name="all"
                  checked={selectedTags.length === tags.length}
                  onChange={() => {
                    setSelectedTags(selectedTags.length === tags.length ? [] : tags)
                  }}
                />
              </div>
            </div>
            <div className="h-64 overflow-y-auto">
              {tags.map((tag, idx) => (
                <div key={tag}>
                  <label className="hover:bg-tint-02 flex items-center px-1 py-1">
                    <input
                      type="checkbox"
                      value={tag}
                      checked={selectedTags.includes(tag)}
                      onChange={() => handleCheckboxChange(tag)}
                      className="mr-2"
                    />
                    {tag}
                  </label>
                  {/* Render separator below all except for last */}
                  {idx !== tags.length - 1 && <hr className="text-tint-01" />}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Control>
  )
}

export default TagControl
