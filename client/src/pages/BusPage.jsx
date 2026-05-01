import { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Search,
  Navigation,
  Clock,
  Bus,
  RefreshCw,
  ChevronRight,
  X,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { busApi } from '@/services/busApi';

// Fix Leaflet default marker icon issue with Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom bus stop icon
const stopIcon = new L.DivIcon({
  html: `<div style="width:24px;height:24px;background:#2563eb;border:2px solid white;border-radius:12px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 4px rgba(0,0,0,0.3);"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 12 10s-6.7.6-8.5 1.1C2.7 11.3 2 12.1 2 13v3c0 .6.4 1 1 1h2"/><path d="M14 22v-4a2 2 0 0 0-4 0v4"/><path d="M6 18v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2v-2"/><path d="M14 18v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2v-2"/><path d="m8 10-1-6"/><path d="m16 10 1-6"/><rect width="18" height="6" x="3" y="10" rx="1"/></svg></div>`,
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const selectedStopIcon = new L.DivIcon({
  html: `<div style="width:32px;height:32px;background:#059669;border:3px solid white;border-radius:16px;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 6px rgba(0,0,0,0.4);"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 12 10s-6.7.6-8.5 1.1C2.7 11.3 2 12.1 2 13v3c0 .6.4 1 1 1h2"/><path d="M14 22v-4a2 2 0 0 0-4 0v4"/><path d="M6 18v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2v-2"/><path d="M14 18v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2v-2"/><path d="m8 10-1-6"/><path d="m16 10 1-6"/><rect width="18" height="6" x="3" y="10" rx="1"/></svg></div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const userIcon = new L.DivIcon({
  html: `<div style="width:16px;height:16px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 0 0 3px rgba(59,130,246,0.4)"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  className: '',
});

// Component to recenter map
function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || map.getZoom(), { animate: true });
    }
  }, [center, zoom, map]);
  return null;
}

// Calculate minutes until arrival
function minutesUntil(isoTime) {
  const diff = new Date(isoTime) - new Date();
  return Math.round(diff / 60000);
}

// Format arrival time as HH:MM
function formatTime(isoTime) {
  const d = new Date(isoTime);
  return d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
}

// Color for route number badge
const ROUTE_COLORS = [
  'bg-blue-600',
  'bg-emerald-600',
  'bg-violet-600',
  'bg-amber-600',
  'bg-rose-600',
  'bg-cyan-600',
  'bg-orange-600',
  'bg-teal-600',
];
function routeColor(routeNumber) {
  if (!routeNumber) return 'bg-slate-600';
  let hash = 0;
  for (const ch of String(routeNumber)) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffffff;
  return ROUTE_COLORS[Math.abs(hash) % ROUTE_COLORS.length];
}

// Arrival row component
function ArrivalRow({ arrival }) {
  const mins = minutesUntil(arrival.arrivalTime);
  if (mins < -2) return null; // skip past arrivals

  const minsLabel =
    mins <= 0 ? 'עכשיו' : mins === 1 ? 'דקה' : `${mins} דק'`;
  const urgent = mins >= 0 && mins <= 3;

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-700/50 last:border-0">
      <div
        className={`${routeColor(arrival.routeNumber)} text-white text-sm font-bold px-2.5 py-1 rounded-lg min-w-[48px] text-center leading-none`}
      >
        {arrival.routeNumber || '?'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-200 truncate leading-tight">
          {arrival.routeName || 'קו אוטובוס'}
        </p>
        <p className="text-xs text-slate-500 truncate">{arrival.agency}</p>
      </div>
      <div className="text-right shrink-0">
        <p
          className={`text-sm font-bold ${urgent ? 'text-green-400' : 'text-blue-400'}`}
        >
          {minsLabel}
        </p>
        <p className="text-xs text-slate-500">{formatTime(arrival.arrivalTime)}</p>
      </div>
    </div>
  );
}

// Stop card in sidebar
function StopCard({ stop, selected, onClick }) {
  const upcoming = (stop.arrivals || []).filter(
    (a) => minutesUntil(a.arrivalTime) >= -1
  );
  const next3 = upcoming.slice(0, 3);

  return (
    <button
      onClick={onClick}
      className={`w-full text-right p-4 rounded-xl border transition-all duration-200 mb-2 ${
        selected
          ? 'bg-blue-900/40 border-blue-500 shadow-lg shadow-blue-900/30'
          : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-700/60 hover:border-slate-600'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0 text-right">
          <div className="flex items-center gap-2 justify-end">
            <span className="text-white font-semibold text-sm leading-tight truncate">
              {stop.name}
            </span>
            <MapPin size={13} className="text-blue-400 shrink-0" />
          </div>
          <div className="flex items-center gap-2 mt-0.5 justify-end">
            <span className="text-slate-400 text-xs">{stop.city}</span>
            <span className="text-slate-600 text-xs">•</span>
            <span className="text-slate-500 text-xs">תחנה {stop.code}</span>
          </div>
          {stop.distance != null && (
            <p className="text-slate-500 text-xs mt-0.5">{stop.distance} מ'</p>
          )}
        </div>
      </div>

      {next3.length > 0 && (
        <div className="mt-2.5 flex gap-1.5 flex-wrap justify-end">
          {next3.map((a, i) => {
            const mins = minutesUntil(a.arrivalTime);
            return (
              <span
                key={i}
                className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${routeColor(a.routeNumber)} text-white`}
              >
                <span className="font-bold">{a.routeNumber}</span>
                <span className="opacity-80">
                  {mins <= 0 ? 'עכשיו' : `${mins} דק'`}
                </span>
              </span>
            );
          })}
        </div>
      )}

      {upcoming.length === 0 && (
        <p className="text-slate-600 text-xs mt-2 text-right">אין אוטובוסים קרובים</p>
      )}
    </button>
  );
}

export default function BusPage() {
  const [mode, setMode] = useState('idle'); // idle | locating | nearby | search | arrivals
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([31.7683, 35.2137]); // default: Jerusalem
  const [mapZoom, setMapZoom] = useState(13);
  const [stops, setStops] = useState([]);
  const [selectedStop, setSelectedStop] = useState(null);
  const [arrivals, setArrivals] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [arrivalsLoading, setArrivalsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fetchedAt, setFetchedAt] = useState(null);
  const refreshTimerRef = useRef(null);

  // Auto-refresh every 45 seconds
  useEffect(() => {
    if (mode === 'nearby' && userLocation) {
      refreshTimerRef.current = setInterval(() => {
        fetchNearby(userLocation.lat, userLocation.lon, false);
      }, 45000);
    }
    return () => clearInterval(refreshTimerRef.current);
  }, [mode, userLocation]);

  const fetchNearby = useCallback(async (lat, lon, showLoader = true) => {
    if (showLoader) setLoading(true);
    setError('');
    try {
      const res = await busApi.getNearby(lat, lon);
      setStops(res.data.stops || []);
      setFetchedAt(res.data.fetchedAt);
      if (res.data.stops.length > 0) {
        setMapCenter([lat, lon]);
        setMapZoom(16);
      }
    } catch {
      setError('שגיאה בטעינת תחנות. אנא נסה שוב.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Get location on mount
  useEffect(() => {
    if (mode === 'idle') {
      handleLocate();
    }
  }, []);

  const handleLocate = () => {
    setMode('locating');
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lon: longitude });
        setMapCenter([latitude, longitude]);
        setMode('nearby');
        fetchNearby(latitude, longitude);
      },
      () => {
        setError('לא ניתן לאתר מיקום. אנא אפשר גישה למיקום בדפדפן.');
        setMode('idle');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setMode('search');
    setLoading(true);
    setError('');
    setSelectedStop(null);
    setArrivals([]);
    try {
      const res = await busApi.searchStops(searchQuery.trim());
      const rawStops = res.data || [];
      // Wrap as stops with empty arrivals
      setStops(
        rawStops.map((s) => ({
          code: s.code,
          name: s.name,
          city: s.city,
          lat: s.lat,
          lon: s.lon,
          arrivals: [],
        }))
      );
      if (rawStops.length > 0 && rawStops[0].lat && rawStops[0].lon) {
        setMapCenter([rawStops[0].lat, rawStops[0].lon]);
        setMapZoom(15);
      }
      if (rawStops.length === 0) setError('׳׳ ׳ ׳׳¦׳׳• ׳×׳—׳ ׳•׳×. ׳ ׳¡׳” ׳©׳ ׳¢׳™׳¨ ׳׳• ׳׳¡׳₪׳¨ ׳×׳—׳ ׳”.');
    } catch {
      setError('׳©׳’׳™׳׳” ׳‘׳—׳™׳₪׳•׳©. ׳׳ ׳ ׳ ׳¡׳” ׳©׳•׳‘.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStop = async (stop) => {
    setSelectedStop(stop);
    setArrivalsLoading(true);
    setArrivals([]);
    setMapCenter([stop.lat, stop.lon]);
    setMapZoom(17);
    try {
      const res = await busApi.getArrivals(stop.code);
      setArrivals(res.data.arrivals || []);
    } catch {
      setArrivals([]);
    } finally {
      setArrivalsLoading(false);
    }
  };

  const handleRefresh = () => {
    if (mode === 'nearby' && userLocation) {
      fetchNearby(userLocation.lat, userLocation.lon);
    } else if (selectedStop) {
      handleSelectStop(selectedStop);
    }
  };

  const handleClearSelection = () => {
    setSelectedStop(null);
    setArrivals([]);
  };

  const upcomingArrivals = arrivals.filter((a) => minutesUntil(a.arrivalTime) >= -1);

  return (
    <div className="flex flex-col bg-slate-900" style={{ height: '100vh', paddingTop: '88px' }} dir="rtl">
      {/* Top Bar */}
      <div className="bg-slate-800/90 backdrop-blur-sm border-b border-slate-700 px-4 py-3 z-10 shadow-xl">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-blue-400 shrink-0">
              <Bus size={22} />
              <span className="font-bold text-white text-lg hidden sm:block">לוח זמנים</span>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="׳—׳₪׳© ׳×׳—׳ ׳” ׳׳₪׳™ ׳©׳, ׳¢׳™׳¨ ׳׳• ׳׳¡׳₪׳¨..."
                  className="w-full bg-slate-700 border border-slate-600 text-white placeholder-slate-400 rounded-xl pr-9 pl-4 py-2 text-sm focus:outline-none focus:border-blue-500 transition"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !searchQuery.trim()}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-medium transition shrink-0"
              >
                חפש
              </button>
            </form>

            {/* Locate */}
            <button
              onClick={handleLocate}
              disabled={mode === 'locating' || loading}
              title="׳×׳—׳ ׳•׳× ׳§׳¨׳•׳‘׳•׳× ׳׳׳™׳™"
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-3 py-2 rounded-xl text-sm font-medium transition shrink-0"
            >
              {mode === 'locating' ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Navigation size={16} />
              )}
              <span className="hidden sm:block">׳׳™׳“ ׳׳™׳§׳•׳׳™</span>
            </button>

            {/* Refresh */}
            {(mode === 'nearby' || selectedStop) && (
              <button
                onClick={handleRefresh}
                disabled={loading || arrivalsLoading}
                title="׳¨׳¢׳ ׳"
                className="p-2 text-slate-400 hover:text-white transition"
              >
                <RefreshCw size={16} className={loading || arrivalsLoading ? 'animate-spin' : ''} />
              </button>
            )}
          </div>

          {/* Status bar */}
          {fetchedAt && mode === 'nearby' && (
            <p className="text-slate-500 text-xs mt-1.5 text-right">
              <Clock size={11} className="inline ml-1" />
              ׳¢׳•׳“׳›׳: {new Date(fetchedAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              {' ֲ· '}{stops.length} ׳×׳—׳ ׳•׳× ׳§׳¨׳•׳‘׳•׳×
            </p>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <div className="w-full lg:w-[420px] flex flex-col bg-slate-900 border-l border-slate-700/50 overflow-hidden shrink-0 absolute lg:relative z-40 h-[40vh] lg:h-full bottom-0 lg:bottom-auto">
          <div className="flex-1 overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 bg-red-900/30 border border-red-700/50 text-red-300 rounded-xl px-4 py-3 mb-3 text-sm">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Loading skeleton */}
            {loading && (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-slate-800/60 rounded-xl p-4 animate-pulse">
                    <div className="h-4 bg-slate-700 rounded w-3/4 mb-2 mr-auto" />
                    <div className="h-3 bg-slate-700 rounded w-1/2 mb-3 mr-auto" />
                    <div className="flex gap-2 justify-end">
                      <div className="h-5 bg-slate-700 rounded-full w-16" />
                      <div className="h-5 bg-slate-700 rounded-full w-14" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Idle welcome */}
            {!loading && mode === 'idle' && (
              <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center px-6 py-12">
                <div className="w-20 h-20 bg-blue-900/30 rounded-full flex items-center justify-center mb-5 border border-blue-700/30">
                  <Bus size={36} className="text-blue-400" />
                </div>
                <h2 className="text-white font-bold text-xl mb-2">׳׳•׳— ׳–׳׳ ׳™׳ ׳׳׳•׳˜׳•׳‘׳•׳¡׳™׳</h2>
                <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                  ׳׳¦׳ ׳×׳—׳ ׳•׳× ׳§׳¨׳•׳‘׳•׳× ׳׳׳™׳ ׳׳• ׳—׳₪׳© ׳׳₪׳™ ׳©׳ ׳×׳—׳ ׳”, ׳¢׳™׳¨ ׳׳• ׳׳¡׳₪׳¨ ׳×׳—׳ ׳”
                </p>
                <button
                  onClick={handleLocate}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-medium transition shadow-lg shadow-blue-900/30"
                >
                  <Navigation size={18} />
                  הצג תחנות קרובות אלי
                </button>
              </div>
            )}

            {/* Selected stop arrivals panel */}
            {selectedStop && (
              <div className="bg-slate-800/80 rounded-xl border border-blue-700/40 mb-3 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-blue-900/30 border-b border-slate-700/50">
                  <button
                    onClick={handleClearSelection}
                    className="text-slate-400 hover:text-white transition p-1"
                  >
                    <X size={16} />
                  </button>
                  <div className="text-right">
                    <div className="flex items-center gap-1.5 justify-end">
                      <span className="text-white font-bold text-base">{selectedStop.name}</span>
                      <MapPin size={14} className="text-blue-400" />
                    </div>
                    <p className="text-slate-400 text-xs">
                      {selectedStop.city} • תחנה {selectedStop.code}
                    </p>
                  </div>
                </div>

                <div className="px-4 py-2">
                  {arrivalsLoading && (
                    <div className="flex items-center justify-center gap-2 py-6 text-slate-400">
                      <Loader2 size={16} className="animate-spin" />
                      <span className="text-sm">טוען זמני הגעה...</span>
                    </div>
                  )}

                  {!arrivalsLoading && upcomingArrivals.length === 0 && (
                    <div className="text-center py-6">
                      <Clock size={24} className="text-slate-600 mx-auto mb-2" />
                      <p className="text-slate-500 text-sm">אין אוטובוסים בשעה הקרובה</p>
                    </div>
                  )}

                  {!arrivalsLoading && upcomingArrivals.map((a, i) => (
                    <ArrivalRow key={i} arrival={a} />
                  ))}
                </div>
              </div>
            )}

            {/* Stops list */}
            {!loading && stops.length > 0 && (
              <>
                <p className="text-slate-500 text-xs mb-2 pr-1 text-right">
                  {mode === 'nearby' ? 'תחנות קרובות' : 'תוצאות חיפוש'}
                  {' '}({stops.length})
                </p>
                {stops.map((stop) => (
                  <StopCard
                    key={stop.code}
                    stop={stop}
                    selected={selectedStop?.code === stop.code}
                    onClick={() => handleSelectStop(stop)}
                  />
                ))}
              </>
            )}
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative h-[60vh] lg:h-full">
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            className="w-full h-full"
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapController center={mapCenter} zoom={mapZoom} />

            {/* User location marker */}
            {userLocation && (
              <Marker
                position={[userLocation.lat, userLocation.lon]}
                icon={userIcon}
              >
                <Popup>המיקום שלך</Popup>
              </Marker>
            )}

            {/* Stop markers */}
            {stops.map((stop) =>
              stop.lat && stop.lon ? (
                <Marker
                  key={stop.code}
                  position={[stop.lat, stop.lon]}
                  icon={selectedStop?.code === stop.code ? selectedStopIcon : stopIcon}
                  eventHandlers={{ click: () => handleSelectStop(stop) }}
                >
                  <Popup>
                    <div className="text-right" dir="rtl" style={{ minWidth: 160 }}>
                      <p className="font-bold text-sm">{stop.name}</p>
                      <p className="text-gray-500 text-xs mb-1">
                        {stop.city} • תחנה {stop.code}
                      </p>
                      {(stop.arrivals || []).slice(0, 3).map((a, i) => {
                        const mins = minutesUntil(a.arrivalTime);
                        if (mins < -1) return null;
                        return (
                          <div key={i} className="flex items-center gap-2 text-xs mt-0.5">
                            <span className="font-bold text-blue-600">{a.routeNumber}</span>
                            <span className="text-gray-600">
                              {mins <= 0 ? 'עכשיו' : `${mins} דקות`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </Popup>
                </Marker>
              ) : null
            )}
          </MapContainer>

          {/* Map overlay hint */}
          {mode === 'idle' && (
            <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center pointer-events-none">
              <div className="bg-slate-800/90 border border-slate-700 rounded-2xl px-8 py-6 text-center max-w-xs">
                <MapPin size={32} className="text-blue-400 mx-auto mb-3" />
                <p className="text-white font-semibold mb-1">מפת תחנות אוטובוס</p>
                <p className="text-slate-400 text-sm">
                  לחץ על "ליד מיקומי" או חפש תחנה כדי להתחיל
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


