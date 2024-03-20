import React from 'react'
import { DB, Incident } from 'types'
import { useMap } from 'react-leaflet'

interface InfoPanelControlProps {
  data: DB
  incident: Incident | null
  onClose: () => void
}

const InfoPanelControl: React.FC<InfoPanelControlProps> = ({ data, incident, onClose }) => {
  const map = useMap()

  const disableZoom = () => {
    map.scrollWheelZoom.disable()
    map.dragging.disable()
  }

  const enableZoom = () => {
    map.scrollWheelZoom.enable()
    map.dragging.enable()
  }

  if (window.innerWidth < 1280 && incident) {
    map.dragging.disable()
  }
  const newClose = function () {
    if (window.innerWidth < 1280) {
      map.dragging.enable()
    }
    onClose()
  }
  return (
    <div
      key={'overlay'}
      className={`${
        incident ? 'w-[100%] md:w-[400px]' : 'w-0'
      } duration-400 fixed left-0 z-[1000] box-border h-screen cursor-default overflow-y-auto bg-tint-02 bg-opacity-60 !font-proxima-nova shadow-lg backdrop-blur-sm transition-all duration-100`}
      onMouseEnter={disableZoom}
      onMouseLeave={enableZoom}
    >
      {incident && (
        <>
          <span
            className="absolute right-6 top-6 h-4 w-4 cursor-pointer text-center text-2xl font-extrabold leading-4 text-shade-01 transition delay-75 ease-in-out hover:scale-125"
            onClick={newClose}
          >
            &times;
          </span>

          <div key={incident.name} className="px-6 py-10">
            <div className="mb-4">
              <span className="inline text-2xl font-bold text-shade-02">{incident.name}</span>
            </div>
            <div className="font-merriweather text-base">
              <div className="mb-4 text-sm text-shade-02">
                {incident.year}
                <br />
                {data.Types[incident.typeID].name}
                <br />
                {data.Categories[data.Types[incident.typeID].categoryID].name}
              </div>

              <div className="mb-6 text-shade-01">{incident.description}</div>

              {incident.countries && incident.countries.length > 0 && (
                <div className="mb-4">
                  <span className="font-proxima-nova font-bold text-shade-01">Countries:</span>
                  <div className="ml-2 mt-2">
                    {incident.countries.map((location) => (
                      <span
                        key={location}
                        className="mb-2 mr-2 inline-block rounded-full bg-tint-01 px-3 py-1 font-proxima-nova font-semibold text-shade-02"
                      >
                        {location}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default InfoPanelControl
