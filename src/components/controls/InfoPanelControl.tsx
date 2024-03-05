import ExternalLinkSvg from 'assets/external_link.svg'
import React from 'react'
import { Stakeholder } from 'types'
import { useMap } from 'react-leaflet'

interface InfoPanelControlProps {
  stakeholder: Stakeholder | null
  onClose: () => void
}

const InfoPanelControl: React.FC<InfoPanelControlProps> = ({ stakeholder, onClose }) => {
  const map = useMap()

  const disableZoom = () => {
    map.scrollWheelZoom.disable()
    map.dragging.disable()
  }

  const enableZoom = () => {
    map.scrollWheelZoom.enable()
    map.dragging.enable()
  }

  const extractDriveFileId = (link: string): string | null => {
    const match = link.match(/id=([a-zA-Z0-9_-]+)/)
    return match ? match[1] : null
  }

  const driveFileId = stakeholder?.logo ? extractDriveFileId(stakeholder.logo) : null
  if (window.innerWidth < 1280 && stakeholder) {
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
        stakeholder ? 'w-[100%] md:w-[400px]' : 'w-0'
      } duration-400 fixed left-0 z-[1000] box-border h-screen cursor-default overflow-y-auto bg-tint-02 bg-opacity-80 !font-proxima-nova shadow-md transition-all duration-100`}
      onMouseEnter={disableZoom}
      onMouseLeave={enableZoom}
    >
      {stakeholder && (
        <>
          <span
            className="absolute right-6 top-6 h-4 w-4 cursor-pointer text-center text-2xl font-extrabold leading-4 text-shade-01 transition delay-75 ease-in-out hover:scale-125"
            onClick={newClose}
          >
            &times;
          </span>

          <div key={stakeholder.contact} className="px-6 py-10">
            <div className="mb-4 ">
              <span className="inline">
                <a
                  href={stakeholder.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gradient-to-r from-shade-01 to-shade-02 bg-[length:0_0.1em] bg-[position:0_100%] bg-no-repeat text-2xl font-bold !text-shade-02 transition-all duration-150 hover:bg-[length:100%_0.1em]"
                >
                  {stakeholder.name}
                </a>
                <span className="inline-block align-text-bottom">
                  <img src={ExternalLinkSvg} alt="link" className="ml-2 h-5" />
                </span>
              </span>
            </div>
            {driveFileId && (
              <img
                className="mx-auto mb-5 w-80"
                src={`https://drive.google.com/thumbnail?id=${driveFileId}&sz=w1000`}
                alt={`${stakeholder.name} logo`}
              />
            )}
            <div className="font-merriweather ">
              <div className="mb-6 text-sm text-shade-01">{stakeholder.description}</div>
              <div className="mb-4 font-bold text-shade-01">
                <span className="font-proxima-nova">HEADQUARTERS:</span> <span className="text-sm font-normal">{stakeholder.headquarter}</span>
              </div>
              {stakeholder.locationsServed && stakeholder.locationsServed.length > 0 && (
                <div className="mb-4">
                  <span className="font-proxima-nova font-bold text-shade-01">LOCATIONS SERVED:</span>
                  <div className="ml-2 mt-2">
                    {stakeholder.locationsServed.map((location) => (
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
              {stakeholder.contact !== '' && (
                <div className="mb-4 font-bold text-shade-01">
                  <span className="font-proxima-nova">CONTACT:</span> <span className="text-sm font-normal">{stakeholder.contact}</span>
                </div>
              )}
              {stakeholder.tags && stakeholder.tags.length > 0 && (
                <div className="mb-4">
                  <span className="font-proxima-nova font-bold text-shade-01">TAGS:</span>
                  <div className="ml-2 mt-2">
                    {stakeholder.tags.map((tag) => (
                      <span
                        key={tag}
                        className="mb-2 mr-2 inline-block rounded-full bg-tint-01 px-3 py-1 font-proxima-nova font-semibold text-shade-02"
                      >
                        {tag}
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
