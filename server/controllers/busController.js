import AppError from '../utils/AppError.js';
import BusStop from '../models/busStopModel.js';

const STRIDE_API = 'https://open-bus-stride-api.hasadna.org.il';
const STOPS_SYNC_TTL_MS = 24 * 60 * 60 * 1000;
const ARRIVALS_CACHE_TTL_MS = 90 * 1000;
const LIVE_CACHE_TTL_MS = 45 * 1000;
const LIVE_MAX_AGE_MS = 90 * 1000;
const DEFAULT_RADIUS_METERS = 10000;
const MAX_RADIUS_METERS = 10000;
const MIN_RADIUS_METERS = 100;
const STOPS_PAGE_SIZE = 500;
const STOPS_MAX_PAGES = 300;
const arrivalsCache = new Map();
const liveVehiclesCache = new Map();

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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchJsonWithRetry = async (
  url,
  { timeoutMs = 10000, retries = 1, retryDelayMs = 250 } = {}
) => {
  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new AppError(
          `Upstream ${response.status} from Open Bus${body ? `: ${body.slice(0, 180)}` : ''}`,
          502
        );
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timer);
      lastError = error;
      if (attempt < retries) {
        await sleep(retryDelayMs * (attempt + 1));
      }
    }
  }

  throw lastError || new AppError('Unknown upstream fetch error', 502);
};

const setCacheValue = (cache, key, value) => {
  cache.set(key, { value, updatedAt: Date.now() });
};

const getFreshCacheValue = (cache, key, ttlMs) => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.updatedAt > ttlMs) return null;
  return entry.value;
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
    const stopCodeStr = String(stopCode);

    const now = new Date();
    const future = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    const toDate = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    const params = new URLSearchParams({
      arrival_time_from: now.toISOString(),
      arrival_time_to: future.toISOString(),
      gtfs_stop__code: stopCodeStr,
      gtfs_route__date_from: fromDate,
      gtfs_route__date_to: toDate,
      limit: 250,
      order_by: 'arrival_time asc',
    });

    const data = await fetchJsonWithRetry(
      `${STRIDE_API}/gtfs_ride_stops/list?${params.toString()}`,
      { timeoutMs: 9000, retries: 1 }
    );

    const arrivals = (Array.isArray(data) ? data : [])
      .map((rideStop) => ({
        routeNumber: rideStop.gtfs_route__route_short_name || '',
        routeName: rideStop.gtfs_route__route_long_name || '',
        agency: rideStop.gtfs_route__agency_name || '',
        arrivalTime: rideStop.arrival_time,
        departureTime: rideStop.departure_time || rideStop.arrival_time,
      }))
      .filter((a) => a.arrivalTime)
      .sort((a, b) => new Date(a.arrivalTime) - new Date(b.arrivalTime));

    setCacheValue(arrivalsCache, stopCodeStr, arrivals);

    res.status(200).json({
      success: true,
      arrivals,
    });
  } catch (error) {
    const errorCode = error?.cause?.code || error?.code || 'UNKNOWN';
    console.warn(`Upstream arrivals unavailable for stop ${req.params.stopCode} (${errorCode}), using fallback.`);
    const cachedArrivals = getFreshCacheValue(arrivalsCache, String(req.params.stopCode), ARRIVALS_CACHE_TTL_MS);
    if (cachedArrivals) {
      return res.status(200).json({
        success: true,
        arrivals: cachedArrivals,
        source: 'cache-fallback',
      });
    }

    return res.status(200).json({
      success: true,
      arrivals: [],
      source: 'unavailable',
    });
  }
};

export const getLiveVehiclesForStop = async (req, res, next) => {
  try {
    const { stopCode } = req.params;
    const stopCodeStr = String(stopCode);
    const routeFilter = String(req.query.route || '').trim();
    const cacheKey = `${stopCodeStr}::${routeFilter || 'all'}`;
    const now = new Date();
    const fromScheduledTime = new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString();
    const toScheduledTime = new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString();
    const fromRecordedAt = new Date(now.getTime() - 3 * 60 * 1000).toISOString();
    const toRecordedAt = new Date(now.getTime() + 60 * 1000).toISOString();

    const siriStopsParams = new URLSearchParams({
      codes: stopCodeStr,
      limit: '30',
    });

    const siriStopsData = await fetchJsonWithRetry(
      `${STRIDE_API}/siri_stops/list?${siriStopsParams.toString()}`,
      { timeoutMs: 9000, retries: 1 }
    );

    const siriStopIds = (Array.isArray(siriStopsData) ? siriStopsData : [])
      .map((row) => row.id)
      .filter((id) => Number.isFinite(id));

    if (siriStopIds.length === 0) {
      return res.status(200).json({
        success: true,
        vehicles: [],
        routeFilter: routeFilter || null,
        freshnessSeconds: Math.floor(LIVE_MAX_AGE_MS / 1000),
      });
    }

    const rideStopsParams = new URLSearchParams({
      siri_stop_ids: siriStopIds.join(','),
      siri_ride__scheduled_start_time_from: fromScheduledTime,
      siri_ride__scheduled_start_time_to: toScheduledTime,
      limit: '5000',
    });

    const rideStopsData = await fetchJsonWithRetry(
      `${STRIDE_API}/siri_ride_stops/list?${rideStopsParams.toString()}`,
      { timeoutMs: 9000, retries: 1 }
    );

    const ridesMap = new Map();
    (Array.isArray(rideStopsData) ? rideStopsData : [])
      .filter((row) => String(row.siri_stop__code || row.gtfs_stop__code || '') === stopCodeStr)
      .forEach((row) => {
        const rideId = row.siri_ride_id || row.siri_ride__id;
        if (!Number.isFinite(rideId)) return;
        const rideKey = String(rideId);

        const routeNumber = String(row.gtfs_route__route_short_name || '').trim();
        if (routeFilter && routeNumber !== routeFilter) return;

        if (!ridesMap.has(rideKey)) {
          ridesMap.set(rideKey, {
            routeNumber,
            routeName: row.gtfs_route__route_long_name || '',
            lineRef: row.gtfs_route__line_ref ?? null,
            vehicleRef: row.siri_ride__vehicle_ref ?? null,
          });
        }
      });

    const rideIds = Array.from(ridesMap.keys());
    if (rideIds.length === 0) {
      return res.status(200).json({
        success: true,
        vehicles: [],
        routeFilter: routeFilter || null,
        freshnessSeconds: Math.floor(LIVE_MAX_AGE_MS / 1000),
      });
    }

    const chunkSize = 120;
    const liveRows = [];
    for (let i = 0; i < rideIds.length; i += chunkSize) {
      const chunk = rideIds.slice(i, i + chunkSize);
      const liveParams = new URLSearchParams({
        siri_rides__ids: chunk.join(','),
        recorded_at_time_from: fromRecordedAt,
        recorded_at_time_to: toRecordedAt,
        limit: '5000',
        order_by: 'recorded_at_time desc',
      });

      const chunkData = await fetchJsonWithRetry(
        `${STRIDE_API}/siri_vehicle_locations/list?${liveParams.toString()}`,
        { timeoutMs: 9000, retries: 1 }
      );

      if (Array.isArray(chunkData)) {
        liveRows.push(...chunkData);
      }
    }

    const latestLocations = new Map();
    liveRows
      .forEach((row) => {
        const recordedAt = row.recorded_at_time;
        if (!recordedAt) return;

        const ageMs = now.getTime() - new Date(recordedAt).getTime();
        if (!Number.isFinite(ageMs) || ageMs < 0 || ageMs > LIVE_MAX_AGE_MS) return;

        const lat = row.lat;
        const lon = row.lon;
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;

        const rideId = row.siri_ride__id || row.siri_ride_id || row.id;
        const rideKey = String(rideId || '');
        const rideMeta = ridesMap.get(rideKey);
        if (!rideMeta) return;

        const vehicleRef = row.siri_ride__vehicle_ref ?? null;
        const dedupeKey = String(vehicleRef || rideId || row.id);
        if (!dedupeKey) return;

        const candidate = {
          rideId,
          lat,
          lon,
          recordedAt,
          velocity: row.velocity ?? null,
          lineRef: rideMeta.lineRef ?? row.siri_route__line_ref ?? null,
          routeNumber: rideMeta.routeNumber || '',
          routeName: rideMeta.routeName || '',
          vehicleRef,
          distanceFromStopMeters: null,
        };

        const current = latestLocations.get(dedupeKey);
        if (!current || new Date(recordedAt) > new Date(current.recordedAt)) {
          latestLocations.set(dedupeKey, candidate);
        }
      });

    const vehicles = Array.from(latestLocations.values()).sort(
      (a, b) => new Date(b.recordedAt) - new Date(a.recordedAt)
    );

    setCacheValue(liveVehiclesCache, cacheKey, vehicles);

    res.status(200).json({
      success: true,
      vehicles,
      routeFilter: routeFilter || null,
      freshnessSeconds: Math.floor(LIVE_MAX_AGE_MS / 1000),
    });
  } catch (error) {
    const errorCode = error?.cause?.code || error?.code || 'UNKNOWN';
    console.warn(`Upstream live unavailable for stop ${req.params.stopCode} (${errorCode}), using fallback.`);
    const stopCodeStr = String(req.params.stopCode);
    const routeFilter = String(req.query.route || '').trim();
    const cacheKey = `${stopCodeStr}::${routeFilter || 'all'}`;
    const cachedVehicles = getFreshCacheValue(liveVehiclesCache, cacheKey, LIVE_CACHE_TTL_MS);
    if (cachedVehicles) {
      return res.status(200).json({
        success: true,
        vehicles: cachedVehicles,
        source: 'cache-fallback',
        routeFilter: routeFilter || null,
        freshnessSeconds: Math.floor(LIVE_MAX_AGE_MS / 1000),
      });
    }

    return res.status(200).json({
      success: true,
      vehicles: [],
      source: 'unavailable',
      routeFilter: routeFilter || null,
      freshnessSeconds: Math.floor(LIVE_MAX_AGE_MS / 1000),
    });
  }
};
