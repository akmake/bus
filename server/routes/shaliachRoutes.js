import express from 'express';
import { 
  getAllShluchim, 
  createShaliach, 
  updateShaliach, 
  deleteShaliach 
} from '../controllers/shaliachController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import { shaliachValidator } from '../utils/validators.js';

const router = express.Router();

// נתיב פתוח לכולם - קריאת שליחים
router.get('/', getAllShluchim);

// כל הנתיבים מתחת לקו זה דורשים התחברות
router.use(protect);

// ורק מנהלים יכולים לבצע שינויים
router.use(restrictTo('admin'));

router.post('/', shaliachValidator, createShaliach);
router.route('/:id')
  .put(updateShaliach)
  .delete(deleteShaliach);

export default router;