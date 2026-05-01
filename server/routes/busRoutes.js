import express from 'express';
import { 
  getAllStops,
  getNearbyStops, 
  searchStops, 
  getStopArrivals,
  getLiveVehiclesForStop,
  syncStopsFromSource,
} from '../controllers/busController.js';

const router = express.Router();

router.post('/sync-stops', syncStopsFromSource);
router.get('/all', getAllStops);
router.get('/nearby', getNearbyStops);
router.get('/search', searchStops);
router.get('/arrivals/:stopCode', getStopArrivals);
router.get('/live/:stopCode', getLiveVehiclesForStop); // <--- הנתיב החדש

export default router;
