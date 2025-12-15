import axios from 'axios';

// יצירת מופע של Axios עם הגדרות בסיס
const api = axios.create({
  baseURL: '/api', // בגלל הפרוקסי ב-vite.config.js, זה יפנה לפורט 5000
  withCredentials: true, // חובה! זה מה ששולח את ה-Cookie לשרת
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor לתגובות (טיפול גלובלי בשגיאות)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // אם השרת מחזיר 401 (לא מורשה), אפשר כאן לנתק את המשתמש אוטומטית
    // כרגע רק נחזיר את השגיאה בצורה נקייה
    const message = error.response?.data?.message || 'שגיאת תקשורת';
    console.error('API Error:', message);
    return Promise.reject(error);
  }
);

export default api;