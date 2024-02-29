import React from 'react'
import { useMap} from 'react-leaflet'
import { Stakeholder } from 'types'
import ExternalLinkSvg from 'assets/external_link.svg'

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
  if(window.innerWidth < 1280 && stakeholder){
    map.dragging.disable();
  }
  const newClose = function(){
    if(window.innerWidth < 1280){
      map.dragging.enable();
    }
    onClose();
  }
  return (
    <div
      key={"overlay"}
      className={`${
        stakeholder ? 'w-[100%] xl:w-[400px]' : 'w-0'
      } duration-400 fixed left-0 z-[1000] box-border h-screen cursor-default overflow-y-auto bg-white bg-opacity-80 !font-metropolis shadow-md transition-all duration-100`}
      onMouseEnter={disableZoom}
      onMouseLeave={enableZoom}
    >
      {stakeholder && (
        <>
          <span className="absolute w-4 h-4 text-2xl leading-4 text-center transition ease-in-out delay-75 cursor-pointer right-6 top-6 text-black-900 hover:scale-125" onClick={newClose}>
            &times;
          </span>

          <div key={stakeholder.contact} className="px-6 py-10">
            <div className="mb-4 ">
              <span className="inline">
                <a
                  href={stakeholder.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gradient-to-r from-black-900 to-black-500 bg-[length:0_0.1em] bg-[position:0_100%] bg-no-repeat text-2xl font-bold !text-black-700 transition-all duration-150 hover:bg-[length:100%_0.1em]"
                >
                  {stakeholder.name}
                </a>
                <span className="inline-block align-text-bottom">
                  <img src={ExternalLinkSvg} alt="link" className="ml-2 h-5" />
                </span>
              </span>
            </div>
            {driveFileId && <img className="mx-auto mb-5 w-80" src={`https://drive.google.com/thumbnail?id=${driveFileId}&sz=w1000`} alt={`${stakeholder.name} logo`} />}
            <div className="mb-6 text-sm text-black-800">{stakeholder.description}</div>
            <div className="mb-4 font-bold text-black-800">
              HEADQUARTERS: <span className="text-sm font-normal">{stakeholder.headquarter}</span>
            </div>
            <div className="mb-4">
              <span className="font-bold text-black-800">LOCATIONS SERVED:</span>
              <div className="mt-2 ml-2">
                {stakeholder.locationsServed?.map((location) => (
                  <span key={location} className="inline-block px-3 py-1 mb-2 mr-2 font-semibold rounded-full bg-black-100 text-black-700">
                    {location}
                  </span>
                ))}
              </div>
            </div>
            <div className="mb-4 font-bold text-black-800">
              CONTACT: <span className="text-sm font-normal">{stakeholder.contact}</span>
            </div>
            <div className="mb-4">
              <span className="font-bold text-black-800">TAGS:</span>
              <div className="mt-2 ml-2">
                {stakeholder.tags?.map((tag) => (
                  <span key={tag} className="inline-block px-3 py-1 mb-2 mr-2 font-semibold rounded-full bg-black-100 text-black-700">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default InfoPanelControl
