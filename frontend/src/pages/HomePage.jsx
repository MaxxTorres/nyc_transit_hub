import React, {useState, useEffect, useContext} from 'react'
import NavBar from '../components/NavBar'
import MapButtons from '../components/MapButtons'
import MapDisplay from '../components/MapDisplay'
import LongCard from '../components/LongCard'
import ArrivalTimes from '../components/ArrivalTimes'
import { useLocation } from 'react-router-dom';
import { StationsContext } from '../context/StationsContext'

const LINE_ICON_FILE = { "0": "placeholder",
  "1": "1-digit", "2": "2-digit", "3": "3-digit", "4": "4-digit", "5": "5-digit", "6": "6-digit", "7": "7-digit",
  "a": "a-letter", "b": "b-letter", "c": "c-letter", "d": "d-letter", "e": "e-letter", "f": "f-letter", "g": "g-letter",
  "j": "j-letter", "l": "l-letter", "m": "m-letter", "n": "n-letter", "q": "q-letter", "r": "r-letter", "w": "w-letter", "z": "z-letter"
};

function HomePage({handleLogout}) {
  const {stations, favoriteStations} = useContext(StationsContext)

  const [showFavorites, setShowFavorites] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  const allStationsSelect = useLocation();
  const {selectedStation} = allStationsSelect.state || {}
  
  const [focusedStation, setFocusedStation] = useState()

  useEffect(() => {
    if (allStationsSelect.state?.showDetails) {
      setShowDetails(true);
      setFocusedStation(selectedStation)
    }
  }, [allStationsSelect.state]);

  const toggleFavorites = () => {
    setShowFavorites(!showFavorites)
  }

  const toggleDetails = () => {
    setShowDetails(!showDetails)
  }

  const renderedFavorites = favoriteStations.map((stop_id) => {
    const station = stations?.find((s) => s.stop_id === stop_id);
    if (!station) return null
  
    return (
      <button key={station.stop_id} onClick={() => setFocusedStation(station)}>
        <LongCard label={station.stop_name} station={station} style={"small"}/>
      </button>
    );
  });

  let renderedRoutes
  if (focusedStation) {
    renderedRoutes = focusedStation.routes.map((route) => {
      const icon = LINE_ICON_FILE[route.toLowerCase()]
      return(
        <div 
          style={{ backgroundImage: `url(/assets/subway_icons/${icon}.256x256.png)` }}
          className="w-10 h-10 bg-cover">
        </div>
      )
    })
  }

  return (
    <div>
      <NavBar handleLogout={handleLogout}/>

      <button className = "z-[3000] absolute right-5 top-20 !h-16 map-button"
        onClick = {toggleFavorites}>
        Show Favorites
      </button>
      
      {/* Favorites Side Bar */}
      <div className = {`z-[3000] flex flex-col gap-5 absolute w-64 p-5 bg-white h-screen border-r-2"
        transform transition-transform duration-300
        ${showFavorites ? 'translate-x-0' : '-translate-x-full'}`}
        style = {{'paddingTop': '70px'}}>
        <p>Liked Stations</p>
        {renderedFavorites}
      </div>

      {/* Favorites More Details Bottom Bar */}
      <div className = {`z-[4000] shadow-inner rounded-t-3xl fixed w-full h-40 left-0 bottom-0 bg-slate-100 border-t-2
        transform transition-transform duration-300 border-t flex p-5 pl-10 gap-10
        ${showDetails ? 'translate-y-0' : 'translate-y-full'}`}>
        <div>
          <div className = "">{focusedStation ? (<div>{focusedStation.stop_name}</div>) : "Select a station"}</div>
          {focusedStation ? 
          <div className = "flex gap-10 items-center mt-5">
            <div className = "flex gap-2"> 
              {renderedRoutes}
            </div>
          </div> : <div> </div>}
        </div>
          {focusedStation ?
            <div>
              <div className = "bg-white shadow rounded-lg p-2">
                <p className = "underline">Arrival Times</p>
                <div className = "font-semibold">
                  <ArrivalTimes timestamps={focusedStation.next_arrival}/>
                </div>
              </div>
              <div className = "m-2 absolute bottom-0 right-10 flex gap-2 text-gray-400 text-xs">
                <p>stop_id: {focusedStation.stop_id}</p>
                <p>lat: {focusedStation.stop_lat}</p>
                <p>lon: {focusedStation.stop_lon}</p>
              </div>
            </div> 
        : <div></div>}
        
      </div>

      {/* Map with Buttons */}
      <div className="z-[2000] relative h-screen w-full">
        <div className={`absolute top-0 left-20 z-[1000] transform transition-transform duration-300
          ${showFavorites ? 'translate-x-52' : ''}`}>
          <MapButtons label={focusedStation ? (<p>{focusedStation.stop_name}</p>) : "Select a station"} toggleDetails={toggleDetails} station={focusedStation} />
        </div>
          <MapDisplay stations={stations} selectedStation={focusedStation} setSelectedStation={setFocusedStation}/>
      </div>
      
    </div>
  )
}

export default HomePage