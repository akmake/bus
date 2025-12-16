import axios from 'axios';

// שינוי הכתובת לשרת האמיתי ב-Render
const api = axios.create({
  baseURL: 'https://passover1.onrender.com/api', // <--- הכתובת של השרת
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ... המשך הקובץ אותו דבר
export default api;