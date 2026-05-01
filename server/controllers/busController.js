import AppError from '../utils/AppError.js';
import BusStop from '../models/busStopModel.js';

const STRIDE_API = 'https://open-bus-stride-api.hasadna.org.il';
const STOPS_SYNC_TTL_MS = 24 * 60 * 60 * 1000;
const DEFAULT_RADIUS_METERS = 10000;
const MAX_RADIUS_METERS = 10000;
const MIN_RADIUS_METERS = 100;
const STOPS_PAGE_SIZE = 500;
const STOPS_MAX_PAGES = 300;

const getToday = () => new Date().toISOString().split('T')[0];

const normalizeStop = (stop) => {
  const code = String(stop?.code || '').trim();
  const name = String(stop?.name || '').trim();
  const city = String(stop?.city || '').trim();
  const lat = Number(stop?.lat);
  const lon = Number(stop?.lon);

  if (!code || !name || !Number.isFinite(lat) || !Number.isFinite(lon)) {
    return null;
  }

  if (lon < -180 || lon > 180 || lat < -90 || lat > 90) {
    return null;
  }

  return {
    code,
    name,
    city,
    lat,
    lon,
    location: {
      type: 'Point',
      coordinates: [lon, lat],
    },
  };
};

const dedupeStopsByCode = (rawStops = []) => {
  const map = new Map();
  rawStops.forEach((row) => {
    const normalized = normalizeStop(row);
    if (!normalized) return;

    if (!map.has(normalized.code)) {
      map.set(normalized.code, normalized);
    }
  });

  return Array.from(map.values());
};

const fetchStrideStopsPage = async ({ offset, limit, dateFrom, dateTo }) => {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });

  if (dateFrom) params.append('date_from', dateFrom);
  if (dateTo) params.append('date_to', dateTo);

  const response = await fetch(`${STRIDE_API}/gtfs_stops/list?${params.toString()}`);
  if (!response.ok) {
    throw new AppError('Failed to fetch stop data from external source', 502);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
};

const fetchAllStopsFromSource = async () => {
  const today = getToday();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const runFetchLoop = async (withDateFilter) => {
    const allRows = [];
    let previousSignature = '';

    for (let page = 0; page < STOPS_MAX_PAGES; page += 1) {
      const offset = page * STOPS_PAGE_SIZE;
      const batch = await fetchStrideStopsPage({
        offset,
        limit: STOPS_PAGE_SIZE,
        dateFrom: withDateFilter ? weekAgo : undefined,
        dateTo: withDateFilter ? today : undefined,
      });

      if (batch.length === 0) break;

      const firstCode = batch[0]?.code || '';
      const lastCode = batch[batch.length - 1]?.code || '';
      const signature = `${batch.length}:${firstCode}:${lastCode}`;

      if (signature === previousSignature) break;
      previousSignature = signature;

      allRows.push(...batch);

      if (batch.length < STOPS_PAGE_SIZE) break;
    }

    return dedupeStopsByCode(allRows);
  };

  // First try without date filters to capture as many stops as possible.
  let stops = await runFetchLoop(false);

  // Fallback to date-filtered fetch if the API returns an unexpectedly small set.
  if (stops.length < 500) {
    const dateFilteredStops = await runFetchLoop(true);
    if (dateFilteredStops.length > stops.length) {
      stops = dateFilteredStops;
    }
  }

  return stops;
};

const upsertStops = async (stops) => {
  if (!Array.isArray(stops) || stops.length === 0) {
    return { syncedCount: 0 };
  }

  const now = new Date();
  const ops = stops.map((stop) => ({
    updateOne: {
      filter: { code: stop.code },
      update: {
        $set: {
          name: stop.name,
          city: stop.city,
          lat: stop.lat,
          lon: stop.lon,
          location: stop.location,
          lastSyncedAt: now,
        },
      },
      upsert: true,
    },
  }));

  // Avoid one giant bulk operation.
  const chunkSize = 1000;
  for (let i = 0; i < ops.length; i += chunkSize) {
    const chunk = ops.slice(i, i + chunkSize);
    await BusStop.bulkWrite(chunk, { ordered: false });
  }

  return { syncedCount: stops.length };
};

const syncStopsDataset = async ({ force = false } = {}) => {
  const latest = await BusStop.findOne({}, { lastSyncedAt: 1 })
    .sort({ lastSyncedAt: -1 })
    .lean();
  const count = await BusStop.estimatedDocumentCount();

  const hasData = count > 0;
  const isFresh =
    latest?.lastSyncedAt && Date.now() - new Date(latest.lastSyncedAt).getTime() < STOPS_SYNC_TTL_MS;

  if (!force && hasData && isFresh) {
    return {
      synced: false,
      source: 'db-cache',
      count,
      lastSyncedAt: latest.lastSyncedAt,
    };
  }

  const fetchedStops = await fetchAllStopsFromSource();
  const { syncedCount } = await upsertStops(fetchedStops);

  const latestAfterSync = await BusStop.findOne({}, { lastSyncedAt: 1 })
    .sort({ lastSyncedAt: -1 })
    .lean();
  const countAfterSync = await BusStop.estimatedDocumentCount();

  return {
    synced: true,
    source: 'external-sync',
    fetchedCount: fetchedStops.length,
    upsertedCount: syncedCount,
    count: countAfterSync,
    lastSyncedAt: latestAfterSync?.lastSyncedAt || null,
  };
};

const clampRadius = (radiusInput) => {
  const parsed = Number.parseInt(radiusInput, 10);
  if (!Number.isFinite(parsed)) return DEFAULT_RADIUS_METERS;
  return Math.min(Math.max(parsed, MIN_RADIUS_METERS), MAX_RADIUS_METERS);
};

const queryNearbyStopsFromDb = async ({ lat, lon, radius }) => {
  const docs = await BusStop.aggregate([
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [lon, lat] },
        distanceField: 'distance',
        maxDistance: radius,
        spherical: true,
        key: 'location',
      },
    },
    {
      $project: {
        _id: 0,
        code: 1,
        name: 1,
        city: 1,
        lat: 1,
        lon: 1,
        distance: 1,
      },
    },
  ]);

  return docs.map((row) => ({
    code: row.code,
    name: row.name,
    city: row.city,
    lat: row.lat,
    lon: row.lon,
    distance: Math.round(row.distance),
    arrivals: [],
  }));
};

export const syncStopsFromSource = async (req, res, next) => {
  try {
    const force = String(req.query.force || 'true').toLowerCase() !== 'false';
    const syncMeta = await syncStopsDataset({ force });

    res.status(200).json({
      success: true,
      sync: syncMeta,
    });
  } catch (error) {
    console.error('Error syncing stops dataset:', error);
    next(new AppError('Failed to sync stops dataset', 500));
  }
};

export const getNearbyStops = async (req, res, next) => {
  try {
    const { lat, lon, radius } = req.query;
    if (!lat || !lon) {
      return next(new AppError('lat and lon are required', 400));
    }

    const latNum = Number.parseFloat(lat);
    const lonNum = Number.parseFloat(lon);
    const radiusNum = clampRadius(radius);

    if (!Number.isFinite(latNum) || !Number.isFinite(lonNum)) {
      return next(new AppError('lat and lon must be valid numbers', 400));
    }

    try {
      await syncStopsDataset();
    } catch (syncError) {
      // Keep working with existing DB data if sync fails (offline fallback).
      console.warn('Stops sync skipped, serving DB cache:', syncError.message);
    }

    let stops = await queryNearbyStopsFromDb({
      lat: latNum,
      lon: lonNum,
      radius: radiusNum,
    });

    // If DB is empty or stale and user got nothing, force one sync attempt and retry.
    if (stops.length === 0) {
      try {
        await syncStopsDataset({ force: true });
        stops = await queryNearbyStopsFromDb({
          lat: latNum,
          lon: lonNum,
          radius: radiusNum,
        });
      } catch (forceSyncError) {
        console.warn('Forced stops sync failed:', forceSyncError.message);
      }
    }

    res.status(200).json({
      success: true,
      stops,
      radiusMeters: radiusNum,
      fetchedAt: new Date().toISOString(),
      source: 'mongodb',
    });
  } catch (error) {
    console.error('Error fetching nearby stops:', error);
    next(new AppError('Failed to fetch nearby stops', 500));
  }
};

export const getAllStops = async (req, res, next) => {
  try {
    try {
      await syncStopsDataset();
    } catch (syncError) {
      console.warn('Stops sync skipped for /all, serving DB cache:', syncError.message);
    }

    const stops = await BusStop.find({}, { _id: 0, code: 1, name: 1, city: 1, lat: 1, lon: 1 })
      .sort({ city: 1, name: 1 })
      .lean();

    res.status(200).json({
      success: true,
      stops,
      count: stops.length,
      fetchedAt: new Date().toISOString(),
      source: 'mongodb',
    });
  } catch (error) {
    console.error('Error fetching all stops:', error);
    next(new AppError('Failed to fetch all stops', 500));
  }
};

export const searchStops = async (req, res, next) => {
  try {
    const { q, city } = req.query;
    if (!q && !city) {
      return next(new AppError('q or city parameter is required', 400));
    }

    const and = [];
    if (q) {
      and.push({
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { code: { $regex: q, $options: 'i' } },
        ],
      });
    }
    if (city) and.push({ city: { $regex: city, $options: 'i' } });

    const filter = and.length ? { $and: and } : {};
    const stops = await BusStop.find(filter, { _id: 0, code: 1, name: 1, city: 1, lat: 1, lon: 1 })
      .limit(300)
      .lean();

    res.status(200).json({
      success: true,
      stops,
      source: 'mongodb',
    });
  } catch (error) {
    console.error('Error searching stops:', error);
    next(new AppError('Failed to search stops', 500));
  }
};

export const getStopArrivals = async (req, res, next) => {
  try {
    const { stopCode } = req.params;

    const now = new Date();
    const future = new Date(now.getTime() + 90 * 60 * 1000);

    const fromStr = now.toISOString().replace('Z', '+00:00');
    const toStr = future.toISOString().replace('Z', '+00:00');

    const params = new URLSearchParams({
      arrival_time_from: fromStr,
      arrival_time_to: toStr,
      gtfs_stop__code: stopCode,
      limit: 100,
      order_by: 'arrival_time asc',
    });

    const response = await fetch(`${STRIDE_API}/siri_ride_stops/list?${params.toString()}`);
    if (!response.ok) {
      return next(new AppError('Failed to fetch arrivals from external source', 502));
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
      arrivals,
    });
  } catch (error) {
    console.error('Error fetching stop arrivals:', error);
    next(new AppError('Failed to fetch stop arrivals', 500));
  }
};

export const getLiveVehiclesForStop = async (req, res, next) => {
  try {
    const { stopCode } = req.params;
    const now = new Date();
    const future = new Date(now.getTime() + 60 * 60 * 1000);

    const fromStr = now.toISOString().replace('Z', '+00:00');
    const toStr = future.toISOString().replace('Z', '+00:00');

    const ridesParams = new URLSearchParams({
      arrival_time_from: fromStr,
      arrival_time_to: toStr,
      gtfs_stop__code: stopCode,
      limit: 50,
    });

    const ridesRes = await fetch(`${STRIDE_API}/siri_ride_stops/list?${ridesParams.toString()}`);
    if (!ridesRes.ok) return next(new AppError('Failed to fetch active rides', 502));
    const ridesData = await ridesRes.json();

    const rideIds = ridesData.map((r) => r.siri_ride__id).filter(Boolean);
    if (rideIds.length === 0) {
      return res.status(200).json({ success: true, vehicles: [] });
    }

    const locParams = new URLSearchParams({
      siri_ride__id__in: rideIds.join(','),
      limit: 200,
      order_by: 'recorded_at_time desc',
    });

    const locRes = await fetch(`${STRIDE_API}/siri_vehicle_locations/list?${locParams.toString()}`);
    if (!locRes.ok) return next(new AppError('Failed to fetch vehicle locations', 502));
    const locData = await locRes.json();

    const latestLocations = new Map();
    locData.forEach((loc) => {
      if (!latestLocations.has(loc.siri_ride__id)) {
        latestLocations.set(loc.siri_ride__id, loc);
      }
    });

    const vehicles = Array.from(latestLocations.values()).map((loc) => ({
      rideId: loc.siri_ride__id,
      lat: loc.lat,
      lon: loc.lon,
      recordedAt: loc.recorded_at_time,
      velocity: loc.velocity,
    }));

    res.status(200).json({
      success: true,
      vehicles,
    });
  } catch (error) {
    console.error('Error fetching live vehicles:', error);
    next(new AppError('Failed to fetch live vehicles', 500));
  }
};
