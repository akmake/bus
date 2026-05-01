import express from 'express';
import {
  getNearbyStops,
  searchStops,
  getStopArrivals,
} from '../controllers/busController.js';

const router = express.Router();

router.get('/nearby', getNearbyStops);
router.get('/search', searchStops);
router.get('/arrivals/:stopCode', getStopArrivals);

export default router;
