import { defineStore } from 'pinia';
import axios from 'axios';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user_info')) || null,
    token: localStorage.getItem('user_token') || null,
    loading: false,
    error: null
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdmin: (state) => state.user?.role === 'admin',
    userName: (state) => state.user?.name || 'Mon Compte'
  },

  actions: {
    async login(email, password) {
      this.loading = true;
      this.error = null;
      try {
        const { data } = await axios.post('/api/auth/login', { email, password });
        this.user = data;
        this.token = data.token;

        localStorage.setItem('user_info', JSON.stringify(data));
        localStorage.setItem('user_token', data.token);

        axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        return true;
      } catch (err) {
        if (!err.response) {
          this.error = "Impossible de joindre le serveur. Si le backend Render était en veille, son réveil prend environ 30 secondes. Veuillez réessayer dans quelques instants.";
        } else {
          this.error = err.response.data?.message || 'Erreur lors de la connexion';
        }
        return false;
      } finally {
        this.loading = false;
      }
    },

    async register(name, email, password) {
      this.loading = true;
      this.error = null;
      try {
        const { data } = await axios.post('/api/auth/register', { name, email, password });
        this.user = data;
        this.token = data.token;

        localStorage.setItem('user_info', JSON.stringify(data));
        localStorage.setItem('user_token', data.token);

        axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        return true;
      } catch (err) {
        if (!err.response) {
          this.error = "Impossible de joindre le serveur. Si le backend Render était en veille, son réveil prend environ 30 secondes. Veuillez réessayer dans quelques instants.";
        } else {
          this.error = err.response.data?.message || "Erreur lors de l'inscription";
        }
        return false;
      } finally {
        this.loading = false;
      }
    },

    logout() {
      this.user = null;
      this.token = null;
      localStorage.removeItem('user_info');
      localStorage.removeItem('user_token');
      delete axios.defaults.headers.common['Authorization'];
    },

    initAuth() {
      if (this.token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
      }
    }
  }
});
