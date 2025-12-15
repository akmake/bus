import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 דקות
  max: 100, // מקסימום 100 בקשות ל-IP
  message: 'יותר מדי בקשות מכתובת זו, אנא נסה שוב בעוד 15 דקות'
});

export const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // שעה אחת
  max: 10, // מקסימום 10 ניסיונות התחברות כושלים
  message: 'יותר מדי ניסיונות התחברות, נחסמת לשעה הקרובה'
});