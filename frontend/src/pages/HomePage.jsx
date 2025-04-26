import React, {useState, useEffect} from 'react'
import NavBar from '../components/NavBar'
import MapButtons from '../components/MapButtons'
import MapView from '../components/MapView'
import MapDisplay from '../components/MapDisplay'
import SmallCard from '../components/SmallCard'
import { useLocation } from 'react-router-dom';


function HomePage({handleLogout}) {
  const [showFavorites, setShowFavorites] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  const [subwayStatus, setSubwayStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // For MTA data
  const [error, setError] = useState(null);       // For MTA data
  
  const allStationsSelect = useLocation();
  const {selectedStation} = allStationsSelect.state || {}
  
  const [focusedStation, setFocusedStation] = useState({stop_name: "Times Square"})
  const sampleFavorites = ["Times Square", "Jay St", "8th St NYU"]
  
  // --- useEffect Hook for Fetching MTA Data with Polling ---
  useEffect(() => {
    const fetchSubwayStatus = async () => {
      setIsLoading(true);

      try {
        const response = await fetch('http://127.0.0.1:5000/api/subway/status');
        if (!response.ok) {
          const errorData = await response.text(); 
          throw new Error(`HTTP error! status: ${response.status} ${response.statusText} - ${errorData}`);
        }
        const data = await response.json();
        setSubwayStatus(data);
        setError(null);
      } catch (err) {
        console.error("Fetch error:", err.message);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubwayStatus();
    const intervalId = setInterval(fetchSubwayStatus, 60000); // Poll every 60 seconds

    return () => {
      clearInterval(intervalId);
      console.log("Cleared subway status polling interval.");
    };
  }, []); 

  useEffect(() => {
    if (allStationsSelect.state?.showDetails) {
      setShowDetails(true);
      setFocusedStation(selectedStation)
    }
  }, [allStationsSelect.state]);
  
  const renderedFavorites = sampleFavorites.map((station) => {
    return(<SmallCard label={station} />)
  })
  
  const toggleFavorites = () => {
    setShowFavorites(!showFavorites)
  }

  const toggleDetails = () => {
    setShowDetails(!showDetails)
  }

  return (
    <div>
      <NavBar handleLogout={handleLogout}/>

      <button className = "z-[3000] absolute right-5 top-20 !h-16 map-button"
        onClick = {toggleFavorites}>
        Show Favorites
      </button>
      
      {/* Favorites Side Bar */}
      <div className = {`z-[3000] flex flex-col gap-5 absolute w-72 p-5 bg-white h-screen border-r-2"
        transform transition-transform duration-300
        ${showFavorites ? 'translate-x-0' : '-translate-x-full'}`}
        style = {{'padding-top': '70px'}}>
        <p>Liked Stations</p>
        {renderedFavorites}
      </div>

      {/* Favorites More Details Bottom Bar */}
      <div className = {`z-[4000] shadow-inner rounded-t-3xl fixed w-full h-40 left-0 bottom-0 bg-slate-100 border-t-2
        transform transition-transform duration-300 border-t
        ${showDetails ? 'translate-y-0' : 'translate-y-full'}`}>
        <p className = "m-5 ml-10">{focusedStation.stop_name}</p>
      </div>

      {/* Map with Buttons */}
      <div className="z-[2000] relative h-screen w-full">
        <div className={`absolute top-0 left-20 z-[1000] transform transition-transform duration-300
          ${showFavorites ? 'translate-x-52' : ''}`}>
          <MapButtons label={focusedStation.stop_name} toggleDetails={toggleDetails}/>
        </div>
        <MapDisplay tripUpdates={subwayStatus?.trip_updates} selectedStation={focusedStation} />
      </div>
      
    </div>
  )
}

export default HomePage