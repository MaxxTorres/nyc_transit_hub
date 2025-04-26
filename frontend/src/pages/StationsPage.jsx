import React, { useState, useEffect } from 'react'
import NavBar from '../components/NavBar'
import LongCard from '../components/LongCard'
import Dropdown from '../components/Dropdown'
import AccessibilityInfo from '../components/AccessibilityInfo'; 
import {NavLink} from 'react-router-dom'

const SUBWAY_ROUTES = ["1", "2", "3", "4", "5", "6", "7",
  "A", "B", "C", "D", "E", "F", "G",
  "J", "L", "M", "N", "Q", "R", "W", "Z"]
const MAX_STATIONS = 10;

function StationsPage({handleLogout}) {
  const [selectedLine, setSelectedLine] = useState()
  const [stations, setStations] = useState()

  // Accessibility Data (Elevator/Escalator Outages)
  const [accessData, setAccessData] = useState(null);
  const [isAccessLoading, setIsAccessLoading] = useState(true);
  const [accessError, setAccessError] = useState(null); 

  useEffect(() => {
    const fetchAccessData = async () => {
      setIsAccessLoading(true); // Indicate loading accessibility data
      setAccessError(null);     // Clear previous accessibility errors
      console.log("Fetching accessibility outages...");
      try {
        // Fetch accessibility outage data from the backend API
        const response = await fetch('http://127.0.0.1:5000/api/accessibility/outages');
        if (!response.ok) {
          const errorData = await response.text(); // Try to get error text
          throw new Error(`HTTP error! status: ${response.status} ${response.statusText} - ${errorData}`);
        }
        const data = await response.json();
        setAccessData(data); // Store the fetched outage data in state
        console.log("Fetched accessibility data:", data);
      } catch (err) {
        console.error("Fetch accessibility error:", err.message);
        setAccessError(err.message); // Set accessibility error state
      } finally {
        setIsAccessLoading(false); // Finished fetching accessibility data
      }
    };
    fetchAccessData(); // Fetch accessibility data once when component mounts
  }, []);
  // --------------------------------------------------

  useEffect(() => {
    const fetchStations = async () => {
      try {
        const res = await fetch("http://127.0.0.1:5000/api/stations");
        const data = await res.json();
        setStations(data);
      } catch (err) {
        console.error("Failed to fetch stations:", err);
      }
    };
  
    fetchStations();
  }, []);

  const filteredStations = selectedLine 
  ? stations.filter(station => 
      station.routes.length > 0 && 
      station.routes.includes(selectedLine)
    )
  : stations || []

  const limitedStations = filteredStations.slice(0, MAX_STATIONS);

  const renderedStations = limitedStations.length > 0
    ? filteredStations.map((station) => {
        return(
          <NavLink
            to="/home"
            state={{ showDetails: true, selectedStation: station }}
            key={station.stop_id}>
            <LongCard label={station.stop_name} routes={station.routes}/>
          </NavLink>
        );
    })
  : <div>Loading...</div>;

  return (
    <div>
      <NavBar handleLogout = {handleLogout}/>

      <div className = "absolute w-2/3 m-10 mr-2 right-0 top-8">
        <AccessibilityInfo
          outages={accessData}             // Pass accessibility data
          isLoading={isAccessLoading}      // Pass accessibility loading state
          error={accessError}              // Pass accessibility error state
        />
      </div>

      <div className = "m-10 mb-0 mt-48 flex gap-2 items-center">
        <div>Filter by</div>
        <Dropdown label = {"Subway Line"} items = {SUBWAY_ROUTES} onSelect = {setSelectedLine}/>
      </div>

      <div className="flex flex-col gap-5 m-2 w-auto p-10 pt-5 max-h-[500px] overflow-y-auto border rounded shadow-inner">
        {renderedStations}
      </div>
    </div>
  )
}

export default StationsPage