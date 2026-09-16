import { createApp } from 'vue';
import { createPinia } from 'pinia';
import axios from 'axios';
import App from './App.vue';
import router from './router';
import './index.css';

// Configuration de l'URL directe de ton backend Render
axios.defaults.baseURL = 'https://vetements-shop.onrender.com/api';

const app = createApp(App);

app.use(createPinia());
app.use(router);

app.mount('#app');