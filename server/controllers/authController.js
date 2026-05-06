import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import AppError from '../utils/AppError.js';

// יצירת טוקן
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '90d'
  });
};

// יצירה ושליחת עוגייה
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  
  const cookieOptions = {
    expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), 
    httpOnly: true,
    secure: true, 
    sameSite: 'none'
  };

  res.cookie('jwt', token, cookieOptions);

  user.password = undefined;
  
  res.status(statusCode).json({
    status: 'success',
    data: { user }
  });
};
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

// --- פונקציית ההתחברות ---
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. בדיקת קלט
    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }

    // 2. חיפוש המשתמש
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      // אותה הודעה כדי לא לחשוף האם המייל קיים במערכת (timing/enumeration attacks)
      return next(new AppError('Incorrect email or password', 401));
    }

    // 3. בדיקת סיסמה
    const isMatch = await user.correctPassword(password, user.password);

    if (!isMatch) {
      return next(new AppError('Incorrect email or password', 401));
    }

    // 4. הצלחה
    createSendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
};

export const logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json({ status: 'success' });
};

export const getMe = async (req, res, next) => {
  res.status(200).json({
    status: 'success',
    data: { user: req.user }
  });
};