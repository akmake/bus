import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import AppError from '../utils/AppError.js';

// יצירת טוקן
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

// יצירה ושליחת עוגייה
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 יום
    httpOnly: true, // מונע גישה לקוקי דרך JS בדפדפן (אבטחה)
    secure: process.env.NODE_ENV === 'production', // ב-Production רק ב-HTTPS
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  };

  res.cookie('jwt', token, cookieOptions);

  // הסרת הסיסמה מהפלט
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    data: {
      user
    }
  });
};

// הרשמה (לשימוש ראשוני או למנהלים)
export const register = async (req, res, next) => {
  try {
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      role: req.body.role || 'user'
    });

    createSendToken(newUser, 201, res);
  } catch (err) {
    next(err);
  }
};

// התחברות
export const login = async (req, res, next) => {
  const { email, password } = req.body;

  // 1. בדיקה אם יש אימייל וסיסמה
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // 2. בדיקה אם המשתמש קיים והסיסמה נכונה
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3. שליחת טוקן
  createSendToken(user, 200, res);
};

// התנתקות
export const logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json({ status: 'success' });
};

// בדיקה מי המשתמש המחובר (עבור הקליינט)
export const getMe = async (req, res, next) => {
  // המידלוור protect כבר שם את המשתמש ב-req.user
  res.status(200).json({
    status: 'success',
    data: { user: req.user }
  });
};