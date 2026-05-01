import AppError from '../utils/AppError.js';

const STRIDE_API = 'https://open-bus-stride-api.hasadna.org.il';
const getToday = () => new Date().toISOString().split('T')[0];

export const getNearbyStops = async (req, res, next) => {
  try {
    const { lat, lon, radius = 800 } = req.query;

    if (!lat || !lon) {
      return next(new AppError('lat and lon are required', 400));
    }

    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);
    const radiusNum = Math.min(parseInt(radius), 3000);

    if (isNaN(latNum) || isNaN(lonNum)) {
      return next(new AppError('lat and lon must be valid numbers', 400));
    }

    const latDelta = radiusNum / 111000;
    const lonDelta = radiusNum / (111000 * Math.cos((latNum * Math.PI) / 180));

    const params = new URLSearchParams({
      lat__greater_or_equal: (latNum - latDelta).toFixed(6),
      lat__lower_or_equal: (latNum + latDelta).toFixed(6),
      lon__greater_or_equal: (lonNum - lonDelta).toFixed(6),
      lon__lower_or_equal: (lonNum + lonDelta).toFixed(6),
      limit: 1000
    });

    const response = await fetch(`${STRIDE_API}/gtfs_stops/list?` + params.toString());

    if (!response.ok) {
      return next(new AppError('Failed to fetch bus data from external source', 502));
    }

    const data = await response.json();

    const uniqueStops = new Map();
    (data || []).forEach(stop => {
      if (!uniqueStops.has(stop.code)) {
        uniqueStops.set(stop.code, {
          code: stop.code,
          name: stop.name,
          city: stop.city,
          lat: stop.lat,
          lon: stop.lon,
          distance: Math.round(
            Math.sqrt(
              Math.pow((stop.lat - latNum) * 111000, 2) +
              Math.pow((stop.lon - lonNum) * 111000 * Math.cos((latNum * Math.PI) / 180), 2)
            )
          ),
          arrivals: []
        });
      }
    });

    const stops = Array.from(uniqueStops.values())
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 80);

    res.json({
      success: true,
      stops: stops,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching nearby stops:', error);
    next(new AppError('Server error while fetching bus data', 500));
  }
};

export const searchStops = async (req, res, next) => {
  try {
    const { q, city } = req.query;

    if (!q && !city) {
      return next(new AppError('q or city parameter is required', 400));
    }

    const params = new URLSearchParams({ limit: 100 });
    
    if (q) params.append('name__contains', q);
    if (city) params.append('city__contains', city);

    const response = await fetch(`${STRIDE_API}/gtfs_stops/list?` + params.toString());

    if (!response.ok) {
      return next(new AppError('Failed to fetch from Open Bus API', 502));
    }

    const data = await response.json();

    const stopsMap = new Map();
    data.forEach((stop) => {
      if (!stopsMap.has(stop.code)) {
        stopsMap.set(stop.code, {
          code: stop.code,
          name: stop.name,
          city: stop.city,
          lat: stop.lat,
          lon: stop.lon,
        });
      }
    });

    const stops = Array.from(stopsMap.values());
    res.status(200).json({
      success: true,
      stops
    });
  } catch (error) {
    next(new AppError('Failed to fetch bus data', 500));
  }
};

export const getStopArrivals = async (req, res, next) => {
  try {
    const { stopCode } = req.params;

    const now = new Date();
    const future = new Date(now.getTime() + 90 * 60 * 1000); // 90 min ahead

    const fromStr = now.toISOString().replace('Z', '+00:00');
    const toStr = future.toISOString().replace('Z', '+00:00');

    const params = new URLSearchParams({
      arrival_time_from: fromStr,
      arrival_time_to: toStr,
      gtfs_stop__code: stopCode,
      limit: 100,
      order_by: 'arrival_time asc',
    });

    const response = await fetch(`${STRIDE_API}/siri_ride_stops/list?` + params.toString());

    if (!response.ok) {
      return next(new AppError('Failed to fetch from Open Bus API', 502));
    }

    const data = await response.json();

    const arrivals = data.map((rideStop) => ({
      routeNumber: rideStop.gtfs_route__route_short_name || rideStop.gtfs_route_short_name || '',
      routeName: rideStop.gtfs_route__route_long_name || rideStop.gtfs_route_long_name || '',
      agency: rideStop.gtfs_agency__agency_name || rideStop.gtfs_agency_agency_name || '',
      arrivalTime: rideStop.arrival_time,
      departureTime: rideStop.departure_time || rideStop.arrival_time,
    }));

    res.status(200).json({
      success: true,
      arrivals
    });
  } catch (error) {
    next(new AppError('Failed to fetch stop arrivals', 500));
  }
};
