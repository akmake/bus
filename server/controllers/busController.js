import AppError from '../utils/AppError.js';
import BusStop from '../models/busStopModel.js';

const STRIDE_API = 'https://open-bus-stride-api.hasadna.org.il';
const STOPS_SYNC_TTL_MS = 24 * 60 * 60 * 1000;
const ARRIVALS_CACHE_TTL_MS = 5 * 60 * 1000; // 5 דקות - לוח זמנים לא משתנה הרבה
const LIVE_CACHE_TTL_MS = 45 * 1000;
// Stride רושם נתוני SIRI עם עיכוב קטן. נשתמש בחלון רחב יותר כדי לתפוס גם רשומות שעכשיו נכנסו.
const LIVE_MAX_AGE_MS = 5 * 60 * 1000; // 5 דקות אחורה זה עדיין "טרי" בפועל
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

// מבצעת שאילתת gtfs_ride_stops מול Stride עם פרמטרים שאנחנו מספקים.
const fetchStrideArrivals = async ({ stopCode, fromTime, toTime, dateFrom, dateTo }) => {
  const params = new URLSearchParams({
    arrival_time_from: fromTime.toISOString(),
    arrival_time_to: toTime.toISOString(),
    gtfs_stop__code: String(stopCode),
    gtfs_route__date_from: dateFrom,
    gtfs_route__date_to: dateTo,
    limit: '500',
    order_by: 'arrival_time asc',
  });

  const data = await fetchJsonWithRetry(
    `${STRIDE_API}/gtfs_ride_stops/list?${params.toString()}`,
    { timeoutMs: 12000, retries: 1 }
  );

  return Array.isArray(data) ? data : [];
};

// מושך נתוני SIRI ride_stops לתחנה הזו - מכיל את המרחק האמיתי של האוטובוס מהתחנה
// ומהירותו, שמאפשרים לנו לחשב ETA אמיתי במקום רק זמן מתוזמן.
const fetchSiriRideStops = async ({ stopCode, fromTime, toTime, dateFrom, dateTo }) => {
  const params = new URLSearchParams({
    siri_ride__scheduled_start_time_from: fromTime.toISOString(),
    siri_ride__scheduled_start_time_to: toTime.toISOString(),
    gtfs_date_from: dateFrom,
    gtfs_date_to: dateTo,
    limit: '500',
    order_by: 'siri_ride__scheduled_start_time asc',
  });

  // SIRI לא תומך בפילטר על code ישירות, אז קודם נביא את ה-siri_stop_id
  const siriStopsParams = new URLSearchParams({ codes: String(stopCode), limit: '30' });
  const siriStopsData = await fetchJsonWithRetry(
    `${STRIDE_API}/siri_stops/list?${siriStopsParams.toString()}`,
    { timeoutMs: 9000, retries: 1 }
  );

  const siriStopIds = (Array.isArray(siriStopsData) ? siriStopsData : [])
    .map((r) => r.id)
    .filter((id) => Number.isFinite(id));

  if (siriStopIds.length === 0) return [];

  params.set('siri_stop_ids', siriStopIds.join(','));

  const data = await fetchJsonWithRetry(
    `${STRIDE_API}/siri_ride_stops/list?${params.toString()}`,
    { timeoutMs: 12000, retries: 1 }
  );

  return Array.isArray(data) ? data : [];
};

// מחשב ETA בדקות ממידע SIRI חי. שיטה: מרחק / מהירות, עם תקרה הגיונית.
const computeLiveEtaMinutes = (distanceMeters, velocityKmh, recordedAt) => {
  if (!Number.isFinite(distanceMeters) || distanceMeters < 0) return null;
  // אם המרחק מאוד קטן - האוטובוס כמעט בתחנה
  if (distanceMeters < 50) return 0;

  // אם אין מהירות (האוטובוס עצור), נשתמש במהירות "טיפוסית" של 25 קמ"ש בעיר
  const safeVelocity = Number.isFinite(velocityKmh) && velocityKmh > 5 ? velocityKmh : 25;
  const meters_per_minute = (safeVelocity * 1000) / 60;
  let etaFromVehicle = distanceMeters / meters_per_minute;

  // נתחשב גם בכמה זמן עבר מאז שהמיקום נרשם - כי הוא כבר זז מאז
  if (recordedAt) {
    const ageMinutes = (Date.now() - new Date(recordedAt).getTime()) / 60000;
    if (Number.isFinite(ageMinutes) && ageMinutes > 0) {
      etaFromVehicle = Math.max(0, etaFromVehicle - ageMinutes);
    }
  }

  // מגביל לכל היותר שעתיים, כדי לא להציג מספרים אבסורדיים
  return Math.min(120, Math.max(0, Math.round(etaFromVehicle)));
};

// בונה מפה של נתוני SIRI חיים לפי gtfs_ride_id - כדי לחבר בין מתוזמן לחי
const buildSiriLiveMap = (siriRows) => {
  const map = new Map();
  for (const row of siriRows) {
    const gtfsRideId =
      row.siri_ride__journey_gtfs_ride_id ||
      row.siri_ride__route_gtfs_ride_id ||
      row.siri_ride__gtfs_ride_id;
    if (!Number.isFinite(gtfsRideId)) continue;

    const distance = row.nearest_siri_vehicle_location__distance_from_siri_ride_stop_meters;
    const velocity = row.nearest_siri_vehicle_location__velocity;
    const recordedAt = row.nearest_siri_vehicle_location__recorded_at_time;
    const lat = row.nearest_siri_vehicle_location__lat;
    const lon = row.nearest_siri_vehicle_location__lon;

    if (!recordedAt) continue; // אין מיקום חי לאוטובוס הזה

    // אם כבר יש לנו רשומה לאותו ride - נעדיף את החדשה יותר
    const existing = map.get(gtfsRideId);
    if (existing && new Date(existing.recordedAt) >= new Date(recordedAt)) continue;

    map.set(gtfsRideId, {
      distanceMeters: Number.isFinite(distance) ? distance : null,
      velocity: Number.isFinite(velocity) ? velocity : null,
      recordedAt,
      lat: Number.isFinite(lat) ? lat : null,
      lon: Number.isFinite(lon) ? lon : null,
      vehicleRef: row.siri_ride__vehicle_ref || null,
    });
  }
  return map;
};

const mapStrideRideStops = (rows, siriLiveMap = new Map()) =>
  rows
    .map((rideStop) => {
      const gtfsRideId = rideStop.gtfs_ride_id;
      const liveData = gtfsRideId ? siriLiveMap.get(gtfsRideId) : null;

      let liveEtaMinutes = null;
      if (liveData) {
        liveEtaMinutes = computeLiveEtaMinutes(
          liveData.distanceMeters,
          liveData.velocity,
          liveData.recordedAt
        );
      }

      return {
        routeNumber: String(rideStop.gtfs_route__route_short_name || '').trim(),
        routeName: String(rideStop.gtfs_route__route_long_name || '').trim(),
        agency: String(rideStop.gtfs_route__agency_name || '').trim(),
        lineRef: rideStop.gtfs_route__line_ref ?? null,
        arrivalTime: rideStop.arrival_time, // הזמן המתוזמן המקורי
        departureTime: rideStop.departure_time || rideStop.arrival_time,
        // נתונים חיים (אם יש):
        hasLiveData: !!liveData,
        liveDistanceMeters: liveData?.distanceMeters ?? null,
        liveVelocity: liveData?.velocity ?? null,
        liveRecordedAt: liveData?.recordedAt ?? null,
        liveEtaMinutes, // ETA מחושב במקום הזמן המתוזמן (אם יש מיקום חי)
      };
    })
    .filter((a) => a.arrivalTime && a.routeNumber)
    .sort((a, b) => {
      // מיון לפי ETA חי אם יש, אחרת לפי הזמן המתוזמן
      const aTime = a.liveEtaMinutes != null
        ? Date.now() + a.liveEtaMinutes * 60000
        : new Date(a.arrivalTime).getTime();
      const bTime = b.liveEtaMinutes != null
        ? Date.now() + b.liveEtaMinutes * 60000
        : new Date(b.arrivalTime).getTime();
      return aTime - bTime;
    });

const isoDate = (d) => new Date(d).toISOString().slice(0, 10);

export const getStopArrivals = async (req, res, next) => {
  const stopCodeStr = String(req.params.stopCode);

  try {
    const now = new Date();

    // ננסה אסטרטגיות בסדר עולה של רוחב.
    // אסטרטגיה 1: 6 שעות קדימה - מספיק רוב הזמן ולא מציף בנתונים.
    // אסטרטגיה 2: 24 שעות קדימה - לתחנות שקטות שיש בהן מעט אוטובוסים.
    // אסטרטגיה 3: עד אתמול+יומיים, גם אחורה ב-30 דק - תופס נתונים מתעכבים ב-Stride.
    const dateFromWide = isoDate(new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000));
    const dateToWide = isoDate(new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000));

    const strategies = [
      {
        label: 'next-6h',
        fromTime: new Date(now.getTime() - 5 * 60 * 1000), // 5 דק' אחורה - אוטובוסים שעכשיו עזבו עדיין רלוונטיים
        toTime: new Date(now.getTime() + 6 * 60 * 60 * 1000),
        dateFrom: isoDate(new Date(now.getTime() - 24 * 60 * 60 * 1000)),
        dateTo: isoDate(new Date(now.getTime() + 24 * 60 * 60 * 1000)),
      },
      {
        label: 'next-24h',
        fromTime: new Date(now.getTime() - 30 * 60 * 1000),
        toTime: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        dateFrom: dateFromWide,
        dateTo: dateToWide,
      },
      {
        label: 'next-48h-wide-dates',
        fromTime: new Date(now.getTime() - 60 * 60 * 1000),
        toTime: new Date(now.getTime() + 48 * 60 * 60 * 1000),
        dateFrom: dateFromWide,
        dateTo: dateToWide,
      },
    ];

    // נמשוך במקביל את הזמנים המתוזמנים (gtfs) ואת המיקומים החיים (siri).
    // נריץ את אסטרטגיית ההגעות עד שמוצאים נתונים, אבל את ה-SIRI נביא רק פעם אחת.
    const siriPromise = (async () => {
      try {
        const siriRows = await fetchSiriRideStops({
          stopCode: stopCodeStr,
          fromTime: new Date(now.getTime() - 4 * 60 * 60 * 1000),
          toTime: new Date(now.getTime() + 4 * 60 * 60 * 1000),
          dateFrom: isoDate(new Date(now.getTime() - 24 * 60 * 60 * 1000)),
          dateTo: isoDate(new Date(now.getTime() + 24 * 60 * 60 * 1000)),
        });
        return buildSiriLiveMap(siriRows);
      } catch (err) {
        console.warn(`[arrivals] stop ${stopCodeStr}: SIRI live fetch failed: ${err.message}`);
        return new Map();
      }
    })();

    let arrivals = [];
    let usedStrategy = null;
    let siriLiveMap = new Map();

    for (const strategy of strategies) {
      try {
        const [rows, liveMap] = await Promise.all([
          fetchStrideArrivals({ stopCode: stopCodeStr, ...strategy }),
          // ה-SIRI ממילא רץ במקביל, רק קוראים את התוצאה כאן
          siriPromise,
        ]);
        siriLiveMap = liveMap;
        const mapped = mapStrideRideStops(rows, liveMap);
        if (mapped.length > 0) {
          arrivals = mapped;
          usedStrategy = strategy.label;
          break;
        }
        console.log(`[arrivals] stop ${stopCodeStr}: strategy "${strategy.label}" returned 0 rows`);
      } catch (innerErr) {
        console.warn(
          `[arrivals] stop ${stopCodeStr}: strategy "${strategy.label}" failed: ${innerErr.message}`
        );
      }
    }

    const liveCount = arrivals.filter((a) => a.hasLiveData).length;
    console.log(
      `[arrivals] stop ${stopCodeStr}: returning ${arrivals.length} arrivals, ${liveCount} with live data (strategy=${usedStrategy})`
    );

    // אם הצלחנו לקבל נתונים - מעדכנים cache
    if (arrivals.length > 0) {
      setCacheValue(arrivalsCache, stopCodeStr, arrivals);
    }

    return res.status(200).json({
      success: true,
      arrivals,
      source: usedStrategy ? `stride:${usedStrategy}` : 'empty',
      liveDataCount: liveCount,
      stopCode: stopCodeStr,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    const errorCode = error?.cause?.code || error?.code || 'UNKNOWN';
    console.warn(
      `Upstream arrivals unavailable for stop ${stopCodeStr} (${errorCode}: ${error.message}), using cache fallback.`
    );

    const cachedArrivals = getFreshCacheValue(arrivalsCache, stopCodeStr, ARRIVALS_CACHE_TTL_MS);
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
      message: 'מקור הנתונים אינו זמין כרגע, נסו שוב בעוד מספר רגעים',
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
    // Stride רושם נתוני SIRI עם עיכוב קטן (לרוב 30 שניות עד 2 דקות).
    // חלון של 3 דק' היה צר מדי - מרחיבים ל-15 דק' אחורה כדי לתפוס יותר.
    const fromRecordedAt = new Date(now.getTime() - 15 * 60 * 1000).toISOString();
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
    liveRows.forEach((row) => {
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
    console.warn(
      `Upstream live unavailable for stop ${req.params.stopCode} (${errorCode}), using fallback.`
    );
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