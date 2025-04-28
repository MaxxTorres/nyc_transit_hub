import React from 'react'
import ArrivalTimes from '../components/ArrivalTimes'
import { FaTriangleExclamation } from "react-icons/fa6";

const LINE_ICON_FILE = { "0": "placeholder",
  "1": "1-digit", "2": "2-digit", "3": "3-digit", "4": "4-digit", "5": "5-digit", "6": "6-digit", "7": "7-digit",
  "a": "a-letter", "b": "b-letter", "c": "c-letter", "d": "d-letter", "e": "e-letter", "f": "f-letter", "g": "g-letter",
  "j": "j-letter", "l": "l-letter", "m": "m-letter", "n": "n-letter", "q": "q-letter", "r": "r-letter", "w": "w-letter", "z": "z-letter"
};

export default function LongCard(props) {
  const {label="station", station, style} = props
  const min_time = Math.min(...station.next_arrival)

  const renderedRoutes = station.routes.map((route) => {
    const icon = LINE_ICON_FILE[route.toLowerCase()]
    return(
      <div 
        style={{ backgroundImage: `url(/assets/subway_icons/${icon}.256x256.png)` }}
        className="w-10 h-10 bg-cover">
        
      </div>
    )
  })

  return (
    <div className = "flex hover:scale-105 transition p-2 h-24 shadow-lg w-full border-2 border-mainOrange rounded-lg bg-white">
        <div className = "flex-1">
            <p className = "font-semibold">{label}</p>
            <div className = "p-2 font-bold text-lg"><ArrivalTimes timestamps = {[min_time]} /></div>
        </div>
        { style == "large"? 
          <div className = "w-2/5 border-l border-black p-1 pl-2 flex gap-2">
              {renderedRoutes}
          </div> : ''
        }
    </div>
  )
}
