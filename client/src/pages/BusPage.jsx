import React, { useCallback, useEffect, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { busApi } from '../services/busApi';

const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

const userIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const busIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const FALLBACK_LOCATION = [32.0853, 34.7818];

const MapUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, 13);
  }, [center, map]);
  return null;
};

const BusPage = () => {
  const [location, setLocation] = useState(null);
  const [stops, setStops] = useState([]);
  const [selectedStopCode, setSelectedStopCode] = useState(null);
  const [selectedStopArrivals, setSelectedStopArrivals] = useState([]);
  const [liveVehicles, setLiveVehicles] = useState([]);
  const [loadingStops, setLoadingStops] = useState(true);
  const [loadingStopDetails, setLoadingStopDetails] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [pageError, setPageError] = useState('');

  const fetchNearbyStops = useCallback(async (lat, lon) => {
    try {
      setLoadingStops(true);
      setPageError('');
      const res = await busApi.getNearby(lat, lon, 10000);
      setStops(res.data?.stops || []);
    } catch (error) {
      console.error('Failed to fetch stops', error);
      setStops([]);
      setPageError('לא הצלחנו לטעון תחנות כרגע. בדוק שהשרת רץ ונסה שוב.');
    } finally {
      setLoadingStops(false);
    }
  }, []);

  const fetchStopDetails = useCallback(async (stopCode) => {
    try {
      setLoadingStopDetails(true);
      setPageError('');
      const [arrivalsRes, liveRes] = await Promise.all([
        busApi.getArrivals(stopCode),
        busApi.getLiveVehicles(stopCode),
      ]);

      setSelectedStopArrivals(arrivalsRes.data?.arrivals || []);
      setLiveVehicles(liveRes.data?.vehicles || []);
      setAutoRefreshEnabled(true);
    } catch (error) {
      console.error('Failed to fetch stop detailed data', error);
      setSelectedStopArrivals([]);
      setLiveVehicles([]);
      setAutoRefreshEnabled(false);
      setPageError('אין תקשורת לשרת כרגע (ECONNREFUSED). הפעל את השרת המקומי על פורט 5000.');
    } finally {
      setLoadingStopDetails(false);
    }
  }, []);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const currentLocation = [coords.latitude, coords.longitude];
        setLocation(currentLocation);
        fetchNearbyStops(coords.latitude, coords.longitude);
      },
      () => {
        setLocation(FALLBACK_LOCATION);
        fetchNearbyStops(FALLBACK_LOCATION[0], FALLBACK_LOCATION[1]);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [fetchNearbyStops]);

  useEffect(() => {
    if (!selectedStopCode || !autoRefreshEnabled) return;

    const interval = setInterval(() => {
      fetchStopDetails(selectedStopCode);
    }, 15000);

    return () => clearInterval(interval);
  }, [fetchStopDetails, selectedStopCode, autoRefreshEnabled]);

  const handleStopClick = async (stopCode) => {
    setSelectedStopCode(stopCode);
    setAutoRefreshEnabled(true);
    await fetchStopDetails(stopCode);
  };

  if (!location && loadingStops) {
    return <div className="flex h-screen items-center justify-center text-xl font-semibold">מאתר את המיקום שלך...</div>;
  }

  return (
    <div className="h-screen w-full flex flex-col">
      <div className="p-4 bg-blue-600 text-white shadow-md z-10 relative">
        <h1 className="text-2xl font-bold">מפת אוטובוסים בזמן אמת</h1>
        <p className="text-sm">מוצגות כל התחנות בטווח 10 ק"מ: {stops.length}</p>
        {pageError && <p className="text-xs mt-2 bg-red-500/80 inline-block px-2 py-1 rounded">{pageError}</p>}
      </div>

      <div className="flex-1 w-full relative z-0">
        <MapContainer center={location || FALLBACK_LOCATION} zoom={13} className="h-full w-full">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          <MapUpdater center={location} />

          {location && (
            <Marker position={location} icon={userIcon}>
              <Popup>אתה נמצא כאן</Popup>
            </Marker>
          )}

          {stops.map((stop) => {
            const isSelectedStop = selectedStopCode === stop.code;
            return (
              <Marker
                key={`stop-${stop.code}`}
                position={[stop.lat, stop.lon]}
                eventHandlers={{ click: () => handleStopClick(stop.code) }}
              >
                <Popup className="w-64">
                  <div className="text-right" dir="rtl">
                    <h3 className="font-bold text-lg border-b pb-1 mb-2">{stop.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">מספר תחנה: {stop.code}</p>

                    {!isSelectedStop && (
                      <p className="text-sm italic text-gray-500">לחץ על התחנה כדי לטעון זמני הגעה</p>
                    )}

                    {isSelectedStop && (
                      <div className="max-h-40 overflow-y-auto">
                        <h4 className="font-semibold mb-1">זמני הגעה קרובים:</h4>
                        {loadingStopDetails && <p className="text-sm italic">טוען נתונים...</p>}
                        {!loadingStopDetails && selectedStopArrivals.length === 0 && (
                          <p className="text-sm italic">אין כרגע אוטובוסים קרובים לתחנה זו</p>
                        )}

                        {!loadingStopDetails && selectedStopArrivals.length > 0 && (
                          <ul className="space-y-2">
                            {selectedStopArrivals.slice(0, 10).map((arrival, idx) => {
                              const time = new Date(arrival.arrivalTime).toLocaleTimeString('he-IL', {
                                hour: '2-digit',
                                minute: '2-digit',
                              });
                              return (
                                <li key={`arr-${idx}`} className="bg-gray-50 p-1 rounded border">
                                  <span className="font-bold text-blue-600">קו {arrival.routeNumber || '-'}</span> - יגיע ב: {time}
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {liveVehicles.map((vehicle, idx) => (
            <Marker key={`bus-${vehicle.rideId || idx}`} position={[vehicle.lat, vehicle.lon]} icon={busIcon}>
              <Popup>
                <div className="text-right" dir="rtl">
                  <strong className="text-green-600 border-b block pb-1 mb-1">אוטובוס בזמן אמת</strong>
                  <p className="text-sm">מהירות: {vehicle.velocity ?? '-'} קמ"ש</p>
                  <p className="text-xs text-gray-500 mt-1">עודכן: {new Date(vehicle.recordedAt).toLocaleTimeString('he-IL')}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default BusPage;
