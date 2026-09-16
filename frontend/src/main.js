import { createApp } from 'vue';
import { createPinia } from 'pinia';
import axios from 'axios';
import App from './App.vue';
import router from './router';
import './index.css';

// Configuration dynamique de l'URL du backend (Vercel / Render / Local)
const rawApiUrl = import.meta.env.VITE_API_URL || 'https://vetements-shop.onrender.com';
// Suppression sécurisée de tout '/api' ou '/' à la fin pour éviter '/api/api'
axios.defaults.baseURL = rawApiUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');

// Intercepteur pour attacher automatiquement le token JWT s'il existe
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('user_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

const app = createApp(App);

app.use(createPinia());
app.use(router);

app.mount('#app');