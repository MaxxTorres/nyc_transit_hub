import React, { useRef, useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';

// Mini component that uses useMap to fly to a location
function MapFlyToStation({ station }) {
  const map = useMap();

  useEffect(() => {
    if (
      station &&
      typeof station.stop_lat === 'number' &&
      typeof station.stop_lon === 'number'
    ) {
      map.flyTo([station.stop_lat, station.stop_lon], 15, {
        duration: 1.25,
      });
    } else {
      console.warn("Invalid coordinates for station:", station);
    }
  }, [station, map]);

  return null;
}

function MapDisplay({ stations, selectedStation, setSelectedStation}) {
  const position = [40.7128, -74.0060]; // NYC Coordinates
  const zoomLevel = 13;
  const markerRefs = useRef({});

  const renderedMarkers = useMemo(() => {
    if (!stations) return null;
  
    return stations
      .filter(station => station.next_arrival.length > 0)
      .map((station) => (
      <Marker
        key={station.stop_id}
        position={[station.stop_lat, station.stop_lon]}
        ref={(ref) => {
          if (ref) markerRefs.current[station.stop_id] = ref;
        }}
        eventHandlers={{
          click: () => {
            handleMarkerClick(station);
          }
        }}
      >
        <Popup>
          {station.stop_name || `ID ${station.stop_id}`}<br />
        </Popup>
      </Marker>
    ));
  }, [stations]);

  const handleMarkerClick = (station) => {
    setSelectedStation(station)
  }

  return (
    <MapContainer center={position} zoom={zoomLevel} scrollWheelZoom={true} className="h-screen w-full"
      style = {{marginTop: "-56px"}}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Automatically fly to selected station */}
      {selectedStation && <MapFlyToStation station={selectedStation} />}

      {/* Markers from trip stations */}
      {renderedMarkers}

    </MapContainer>
  );
}

export default MapDisplay;
