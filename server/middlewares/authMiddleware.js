import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import User from '../models/userModel.js';
import AppError from '../utils/AppError.js';

export const protect = async (req, res, next) => {
  try {
    // 1. קבלת הטוקן מהקוקי
    let token;
    if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }

    // 2. אימות הטוקן
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3. בדיקה אם המשתמש עדיין קיים
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(new AppError('The user belonging to this token no longer does exist.', 401));
    }

    // 4. מתן גישה ושמירת המשתמש בבקשה
    req.user = currentUser;
    next();
  } catch (err) {
    next(new AppError('Not authorized to access this route', 401));
  }
};

// הגבלת גישה לפי תפקיד (למשל רק לאדמין)
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};