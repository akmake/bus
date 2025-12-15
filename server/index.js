import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

// ייבוא קבצים פנימיים (הגדרות ותשתיות)
import connectDB from './config/db.js';
import globalErrorHandler from './middlewares/errorMiddleware.js';
import AppError from './utils/AppError.js';
import dashboardRoutes from './routes/dashboardRoutes.js'; // במקום shaliachRoutes
// ייבוא הראוטים (Routes)
import authRoutes from './routes/authRoutes.js';

// ייבוא מידלוור לאבטחת עומסים
import { apiLimiter } from './middlewares/rateLimiter.js';

// טעינת משתני סביבה
dotenv.config();

// אתחול האפליקציה
const app = express();

// התחברות ל-DB
connectDB();

/* ==========================
   Middlewares (תווכה)
   ========================== */

// 1. אבטחה וגישה
app.use(cors({
  origin: 'http://localhost:5173', // הכתובת של ה-Client
  credentials: true // מאפשר שליחת עוגיות (Cookies)
}));
app.use(helmet()); // אבטחת כותרות HTTP

// 2. עיבוד מידע
app.use(express.json()); // קריאת JSON מה-Body
app.use(cookieParser()); // קריאת עוגיות

// 3. לוגים (רק בפיתוח)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// 4. הגבלת בקשות (Rate Limiting) על כל ה-API
app.use('/api', apiLimiter);

/* ==========================
   Routes (נתיבים)
   ========================== */

// נתיב בדיקה בסיסי
app.get('/', (req, res) => {
  res.send('API בית חב"ד כפר יונה - פועל תקין');
});

// חיבור הראוטים המרכזיים
app.use('/api/auth', authRoutes);       // הרשמה, התחברות
app.use('/api', dashboardRoutes); // חיברנו את הכל תחת /api
/* ==========================
   Error Handling (שגיאות)
   ========================== */

// טיפול בנתיבים שלא קיימים (404) - חייב להופיע אחרי כל הראוטים
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// טיפול שגיאות גלובלי (תופס את כל השגיאות שנזרקו)
app.use(globalErrorHandler);

/* ==========================
   Server Start (הפעלת שרת)
   ========================== */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});