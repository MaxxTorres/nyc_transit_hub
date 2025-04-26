import React, { useRef, useEffect } from 'react';
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

function MapDisplay({ tripUpdates, selectedStation }) {
  const position = [40.7128, -74.0060]; // NYC Coordinates
  const zoomLevel = 12;
  const markerRefs = useRef({});

  const updatesWithCoords = (tripUpdates || []).filter(update =>
    update.first_future_stop &&
    update.first_future_stop.latitude != null &&
    update.first_future_stop.longitude != null
  );

  const renderedStopIds = new Set(
    updatesWithCoords.map(update =>
      update.first_future_stop.parent_station || update.first_future_stop.stop_id
    )
  );

  useEffect(() => {
    if (selectedStation) {
      const selectedId = selectedStation.parent_station || selectedStation.stop_id;
      const markerRef = markerRefs.current[selectedId];
      if (markerRef && markerRef.openPopup) {
        markerRef.openPopup();
      } else {
        console.log("Popup not found for stop:", selectedId);
      }
    }
    console.log(selectedStation.stop_name, selectedStation.stop_lat, selectedStation.stop_lon)
  }, [selectedStation]);

  return (
    <MapContainer center={position} zoom={zoomLevel} scrollWheelZoom={true} className="h-screen w-full"
      style = {{marginTop: "-56px"}}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Automatically fly to selected station */}
      {selectedStation && <MapFlyToStation station={selectedStation} />}

      {/* Markers from trip updates */}
      {updatesWithCoords.map(update => {
        const stop = update.first_future_stop;
        const stopId = stop.parent_station || stop.stop_id;
        return (
          <Marker
            key={update.trip_id}
            position={[stop.latitude, stop.longitude]}
            ref={(ref) => {
              if (ref) markerRefs.current[stopId] = ref;
            }}
          >
            <Popup>
              <b>Route: {update.route_id || 'N/A'}</b><br />
              Stop: {stop.stop_name || `ID ${stop.stop_id}`}<br />
              ETA: {new Date(stop.time * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}<br />
              Trip ID: {update.trip_id}
            </Popup>
          </Marker>
        );
      })}

      {/* Fallback marker if selected station not in tripUpdates */}
      
      {selectedStation &&
        typeof selectedStation.stop_lat === 'number' &&
        typeof selectedStation.stop_lon === 'number' && 
        (
        <Marker
          position={[selectedStation.stop_lat, selectedStation.stop_lon]}
          ref={(ref) => {
            const selectedId = selectedStation.parent_station || selectedStation.stop_id;
            if (ref) markerRefs.current[selectedId] = ref;
          }}
        >
          <Popup>
            <b>{selectedStation.stop_name}</b><br />
            Lat: {selectedStation.stop_lat}<br />
            Lon: {selectedStation.stop_lon}
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
}

MapDisplay.defaultProps = {
  tripUpdates: []
};

export default MapDisplay;
