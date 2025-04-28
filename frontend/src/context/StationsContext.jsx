import React, { createContext, useCallback, useState, useEffect } from 'react';
import { getIdToken } from "firebase/auth";

export const StationsContext = createContext();

export function StationsProvider({ children }) {
  const [feedId, setFeedId] = useState('1');
  const [stations, setStations] = useState()
  const [favoriteStations, setFavoriteStations] = useState([])
  const [currentUser, setUser] = useState()

    // --- useEffect Hook for Fetching MTA Data with Polling ---
    useEffect(() => {
        const fetchStations = async () => {

        try {
            const response = await fetch(`http://127.0.0.1:5000/api/stations/${feedId}`);
            if (!response.ok) {
            const errorData = await response.text(); 
            throw new Error(`HTTP error! status: ${response.status} ${response.statusText} - ${errorData}`);
            }
            const data = await response.json();
            console.log("fetching for feed: " + feedId)
            setStations(data);
        } catch (err) {
            console.error("Fetch error:", err.message);
        } 
        };

        fetchStations();
        const intervalId = setInterval(fetchStations, 60000); // Poll every 60 seconds

        return () => {
        clearInterval(intervalId);
        };
    }, [feedId]);


    const fetchFavoriteStations = useCallback(async () => {
        if (!currentUser) return;

        try {
          const token = await getIdToken(currentUser);
          const response = await fetch('http://127.0.0.1:5000/api/user/favorites/stations', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          const data = await response.json();
          setFavoriteStations(Array.isArray(data.favorite_stations) ? data.favorite_stations.sort() : []);
          console.log("Fetched favorite stations:", data.favorite_stations);

        } catch (err) {
          console.error("Error fetching favorite stations:", err);
        }
      }, [currentUser]);

    // useEffect to fetch stations on mount/user change
    useEffect(() => {
    if (currentUser) {
        fetchFavoriteStations();
    } else {
        setFavoriteStations([]);
    }
    }, [currentUser, fetchFavoriteStations]);

    const addFavoriteStation = async (station) => {
        try {
          const token = await getIdToken(currentUser);
          const response = await fetch('http://127.0.0.1:5000/api/user/favorites/stations', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ station_id: station.stop_id })
          });
    
          const data = await response.json();
    
          if (!response.ok) {
             if (response.status === 409) { console.log("station already added") }
             else { throw new Error(data.message || `HTTP error ${response.status}`); }
          } else {
             console.log("Added favorite station:", data.favorite);
             setFavoriteStations(prevStations => [...prevStations, data.favorite.station_id].sort());
          }
    
        } catch (err) {
          console.error("Error adding favorite station:", err);
        }
      };

      const deleteFavoriteStation = async (station) => {
        try {
          const token = await getIdToken(currentUser);
          const response = await fetch(`http://127.0.0.1:5000/api/user/favorites/stations/${station.stop_id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (!response.ok) {
             let errorMsg = `HTTP error ${response.status}`;
             try { const errorData = await response.json(); errorMsg = errorData.message || errorMsg; } catch (e) {}
             throw new Error(errorMsg);
          }

          console.log(`Successfully removed favorite station: ${station.stop_id}`);
          setFavoriteStations(prevStations => prevStations.filter(stationId => stationId !== station.stop_id));

        } catch (err) {
          console.error("Error removing favorite station:", err);
        }
      };


  return (
    <StationsContext.Provider value={{ feedId, stations, favoriteStations, setFeedId, setUser, 
        addFavoriteStation, deleteFavoriteStation
     }}>
      {children}
    </StationsContext.Provider>
  );
}
