import { body, validationResult } from 'express-validator';
import AppError from './AppError.js';

// פונקציית עזר שבודקת אם היו שגיאות
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // מאחדים את כל השגיאות למשפט אחד
    const message = errors.array().map(err => err.msg).join('. ');
    return next(new AppError(message, 400));
  }
  next();
};

// ולידציה להרשמה
export const registerValidator = [
  body('name').notEmpty().withMessage('נא להזין שם מלא'),
  body('email').isEmail().withMessage('נא להזין כתובת אימייל תקינה'),
  body('password').isLength({ min: 6 }).withMessage('סיסמה חייבת להכיל לפחות 6 תווים'),
  handleValidationErrors
];

// ולידציה להתחברות
export const loginValidator = [
  body('email').isEmail().withMessage('נא להזין אימייל תקין'),
  body('password').notEmpty().withMessage('נא להזין סיסמה'),
  handleValidationErrors
];

// ולידציה לשליח
export const shaliachValidator = [
  body('name').notEmpty().withMessage('שם השליח הוא שדה חובה'),
  body('role').notEmpty().withMessage('תפקיד הוא שדה חובה'),
  body('phone').notEmpty().withMessage('מספר טלפון הוא שדה חובה')
    .matches(/^[0-9\-+]{9,15}$/).withMessage('מספר טלפון לא תקין'),
  handleValidationErrors
];