import React from 'react'

interface LegendControlProps {
  selectedStakeholder: any
}

const LegendControl: React.FC<LegendControlProps> = ({ selectedStakeholder}) => {
  return (
    <>
      {selectedStakeholder && (
        <div className={"bg-tint-02 md:absolute md:bottom-3 md:right-3 z-[1000] md:m-3 rounded-md bg-opacity-70 p-3 "}>
          <div className="mt-1 flex items-center">
            <img src={'marker.svg'} alt="Marker 1" className="mr-1 h-8 w-8" />
            <span className="font-proxima-nova text-shade-01 text-sm font-semibold">Headquarters/Registration</span>
          </div>
          <div className="mt-1 flex items-center">
            <img src={'selected-marker.svg'} alt="Selected Marker" className="mr-1 h-8 w-8" />
            <span className="font-proxima-nova text-shade-01 text-sm font-semibold">Selected</span>
          </div>
        </div>
      )}
    </>
  )
}

export default LegendControl
