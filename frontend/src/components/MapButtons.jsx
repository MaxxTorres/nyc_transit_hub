import React, { useState, useEffect, useContext } from 'react'
import {StationsContext } from '../context/StationsContext'
import { FaHeart } from 'react-icons/fa6'
import { FaPenToSquare } from 'react-icons/fa6'

export default function MapButtons(props) {
  const {favoriteStations, addFavoriteStation, deleteFavoriteStation} = useContext(StationsContext)
  const {label, toggleDetails, station} = props
  const [isFavorite, setIsFavorite] = useState()

  useEffect(() => {
    if(station == null){
      setIsFavorite(false)
    }
    else if (favoriteStations.includes(station.stop_id)){
      setIsFavorite(true)
    } else {
      setIsFavorite(false)
    }
  }, [favoriteStations, station])
  
  const handleClick = () => {
    console.log(station.stop_id)
    if (isFavorite) {
      deleteFavoriteStation(station)
      setIsFavorite(false)
    } else {
      addFavoriteStation(station)
      setIsFavorite(true)
    }
  }

  return (
    <div className = "flex items-center gap-2 h-12 m-5 mt-20">
      <div className = "bg-white w-auto rounded-md shadow-lg border border-mainOrange p-2 px-5 text-center">
        {label}
      </div>
      <button className = "map-button"
        onClick = {toggleDetails}>
          <div className = "text-sm"> Details </div>
      </button>
      <button className = "map-button"
        onClick = {handleClick}>
          <div className = {` ${isFavorite ? "text-red-500" : "text-gray-400" } text-lg`}> <FaHeart /> </div>
      </button>
    </div>
  )
}
