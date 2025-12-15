import express from 'express';
import {
  createLead,
  getAllLeads,
  updateLeadStatus,
  getContent,
  updateContent,
  trackVisit,
  getStats
} from '../controllers/dashboardController.js';
import { 
  getActiveReviews, 
  getAllReviews, 
  createReview, 
  deleteReview 
} from '../controllers/reviewController.js'; // <--- ייבוא חדש
import { protect, restrictTo } from '../middlewares/authMiddleware.js';

const router = express.Router();

// --- נתיבים פומביים (Public) ---
router.post('/leads', createLead);
router.get('/content', getContent);
router.get('/reviews', getActiveReviews); // <--- נתיב חדש לאתר
router.post('/track', trackVisit);

// --- נתיבים מוגנים (Admin Only) ---
router.use(protect);
router.use(restrictTo('admin'));

// ניהול לידים
router.get('/admin/leads', getAllLeads);
router.patch('/admin/leads/:id', updateLeadStatus);

// ניהול תוכן וסטטיסטיקה
router.put('/admin/content', updateContent);
router.get('/admin/stats', getStats);

// ניהול ביקורות (Admin)
router.get('/admin/reviews', getAllReviews); // <--- חדש
router.post('/admin/reviews', createReview); // <--- חדש
router.delete('/admin/reviews/:id', deleteReview); // <--- חדש

export default router;