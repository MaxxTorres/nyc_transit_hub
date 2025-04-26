import React from 'react'
import SearchBar from './SearchBar'
import {NavLink} from 'react-router-dom'
import Logo from '../assets/transit_hub_logo.png'

export default function NavBar({handleLogout}) {
  const handleSearch = (query) => {
      console.log('User searched:', query);
  }

  return (
  <div className = "z-[5000] fixed flex items-center bg-mainOrange w-full top-0 drop-shadow-lg h-14">
    <div className = "ml-5 h-11 w-32 bg-contain bg-center bg-no-repeat" style = {{backgroundImage: `url(${Logo})` }}></div>

    <div className = "flex items-center w-full h-full">
      <NavLink 
        to = "/home"
        className={({ isActive }) =>
            `nav-button ${isActive ? "underline" : " "}`}>
          Home
      </NavLink>

      <NavLink 
        to = "/stations"
        className={({ isActive }) =>
            `nav-button ${isActive ? "underline" : " "}`}>
          All Stations
      </NavLink>

    </div>
      <div className = "p-5">
        <button 
          onClick = {handleLogout}
          className = "bg-slate-100 rounded-md p-2 text-sm">Logout</button>
      </div>
  </div>
  )
}
