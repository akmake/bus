import axios from 'axios';

// Uses Vite proxy (/api → localhost:5000) so markers work in development
const busHttp = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

export const busApi = {
  getNearby: (lat, lon, radius = 600) =>
    busHttp.get('/buses/nearby', { params: { lat, lon, radius } }),

  searchStops: (q, city) =>
    busHttp.get('/buses/search', { params: { q, city } }),

  getArrivals: (stopCode) =>
    busHttp.get(`/buses/arrivals/${stopCode}`),
};
