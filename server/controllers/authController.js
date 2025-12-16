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

// --- פונקציית ההתחברות עם הדיבאג ---
export const login = async (req, res, next) => {
  const { email, password } = req.body;

  // הדפסה לטרמינל כדי שנראה מה מגיע מהאתר
  console.log('\n--- Login Attempt ---');
  console.log('Email received:', email);
  console.log('Password received:', password);

  // 1. בדיקת קלט
  if (!email || !password) {
    console.log('❌ Missing email or password');
    return next(new AppError('Please provide email and password', 400));
  }

  // 2. חיפוש המשתמש
  const user = await User.findOne({ email }).select('+password');
  
  if (!user) {
    console.log('❌ User not found in DB');
    return next(new AppError('Incorrect email or password', 401));
  }

  console.log('User found in DB:', user.email);
  console.log('User Role:', user.role);

  // 3. בדיקת סיסמה
  const isMatch = await user.correctPassword(password, user.password);
  
  if (!isMatch) {
    console.log('❌ Password Incorrect');
    return next(new AppError('Incorrect email or password', 401));
  }

  // 4. הצלחה
  createSendToken(user, 200, res);
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