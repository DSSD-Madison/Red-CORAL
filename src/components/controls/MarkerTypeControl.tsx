import { useIsMobile } from '@/hooks/useIsMobile'
import { LucideMapPinned } from 'lucide-react'
import React, { useState } from 'react'
import { ResponsiveDropdown } from './ResponsiveDropdown'

interface MarkerTypeControlProps {
  markerType: 'single' | 'group' | 'groupPie'
  setMarkerType: React.Dispatch<React.SetStateAction<'single' | 'group' | 'groupPie'>>
}

const GroupButton = ({
  displayName,
  id,
  imageSrc,
  markerType,
  setMarkerType,
}: {
  displayName: string
  id: string
  imageSrc: string
  markerType: string
  setMarkerType: any
}) => (
  <div className="flex flex-col items-center">
    <button
      className="flex h-32 w-32 items-center justify-center rounded-md"
      onClick={() => {
        setMarkerType(id)
      }}
    >
      <img
        className={`aspect-square w-full rounded-lg border object-cover transition hover:grayscale-0 ${markerType === id ? 'border-4 border-blue-400' : 'grayscale'}`}
        src={imageSrc}
        alt={displayName}
      />
    </button>
    <span className="mt-2 text-sm">{displayName}</span>
  </div>
)

const MarkerTypeControl: React.FC<MarkerTypeControlProps> = ({ markerType, setMarkerType }) => {
  const isMobile = useIsMobile()
  const [isDropdownVisible, setDropdownVisible] = useState(false)

  const MarkerTypeContent = () => (
    <div className={`${isMobile ? 'w-full' : 'leaflet-bar box-content rounded bg-tint-02/80 p-4 shadow-lg backdrop-blur-sm'}`}>
      <div className="mb-2 text-base font-semibold">Tipo de marcador</div>
      <div className={`flex gap-4 ${isMobile ? 'justify-around' : ''}`}>
        <GroupButton displayName="Individual" id="single" imageSrc="individual-marker.png" markerType={markerType} setMarkerType={setMarkerType} />

        <GroupButton displayName="Grupo" id="group" imageSrc="group-marker.png" markerType={markerType} setMarkerType={setMarkerType} />
        <GroupButton
          displayName="Gráfico circular"
          id="groupPie"
          imageSrc="group-pie-marker.png"
          markerType={markerType}
          setMarkerType={setMarkerType}
        />
      </div>
    </div>
  )

  return (
    <>
      <a
        className="leaflet-control-zoom-out"
        title={'Cambiar tipo de marcador'}
        role="button"
        onClick={(e) => {
          setDropdownVisible(!isDropdownVisible)
          e.preventDefault()
        }}
      >
        <LucideMapPinned className="h-5 w-5" strokeWidth={1} />
      </a>
      <ResponsiveDropdown
        isOpen={isDropdownVisible}
        onClose={() => setDropdownVisible(false)}
        desktopClassName="absolute left-10 top-0.5 z-[1000]"
        snapPoints={[0.4]}
      >
        <MarkerTypeContent />
      </ResponsiveDropdown>
    </>
  )
}

export default MarkerTypeControl
