// import React from 'react'

// interface LegendControlProps {
//   selectedStakeholder: any
// }

// const LegendControl: React.FC<LegendControlProps> = ({ selectedStakeholder }) => {
//   const legend = (
//     <div className="absolute bottom-3 right-3 z-[1000] m-3 block rounded-md bg-tint-02 bg-opacity-70 p-3">
//       <div className="mt-1 flex items-center">
//         <img src={'marker.svg'} alt="Marker 1" className="mr-1 h-8 w-8" />
//         <span className="font-proxima-nova text-sm font-semibold text-shade-01">Headquarters/Registration</span>
//       </div>
//       <div className="mt-1 flex items-center">
//         <img src={'selected-marker.svg'} alt="Selected Marker" className="mr-1 h-8 w-8" />
//         <span className="font-proxima-nova text-sm font-semibold text-shade-01">Selected</span>
//       </div>
//     </div>
//   )

//   // Hide legend only on a smaller screen with stakeholder selected
//   return (
//     <>
//       {!selectedStakeholder && legend}
//       {selectedStakeholder && <div className="hidden md:block">{legend}</div>}
//     </>
//   )
// }

// export default LegendControl
