import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import connectDB from './config/db.js';
import globalErrorHandler from './middlewares/errorMiddleware.js';
import AppError from './utils/AppError.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { apiLimiter } from './middlewares/rateLimiter.js';

dotenv.config();

const app = express();


app.set('trust proxy', 1); 
// ---------------------------

connectDB();

app.use(cors({
  origin: ['http://localhost:5173', 'https://passover1-1.onrender.com'], 
  credentials: true 
}));

app.use(helmet());
app.use(express.json());
app.use(cookieParser());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use('/api', apiLimiter);

app.get('/', (req, res) => {
  res.send('API בית חב"ד כפר יונה - פועל תקין');
});

app.use('/api/auth', authRoutes);
app.use('/api', dashboardRoutes);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});