<script setup>
import { RouterLink, useRouter } from 'vue-router';
import { useCartStore } from '@/stores/cart';
import { useAuthStore } from '@/stores/auth';

const cart = useCartStore();
const auth = useAuthStore();
const router = useRouter();

const handleLogout = () => {
  auth.logout();
  router.push('/login');
};
</script>

<template>
  <header class="bg-white border-b border-slate-100 sticky top-0 z-40">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16 sm:h-20">
        <!-- Logo -->
        <RouterLink to="/" class="flex items-center gap-2">
          <span class="text-xl sm:text-2xl font-black tracking-tighter uppercase text-slate-900">
            ATELIER<span class="text-rose-600">.</span>
          </span>
        </RouterLink>

        <!-- Navigation principale -->
        <nav class="hidden md:flex items-center space-x-8 text-sm font-semibold text-slate-700">
          <RouterLink to="/products" class="hover:text-slate-950 transition">Tous les articles</RouterLink>
          <RouterLink to="/products?category=Homme" class="hover:text-slate-950 transition">Homme</RouterLink>
          <RouterLink to="/products?category=Femme" class="hover:text-slate-950 transition">Femme</RouterLink>
          <RouterLink to="/products?category=Enfant" class="hover:text-slate-950 transition">Enfant</RouterLink>
        </nav>

        <!-- Actions : Profil, Admin & Panier -->
        <div class="flex items-center space-x-4 sm:space-x-6">
          <!-- Espace Admin si connecté en tant qu'admin -->
          <RouterLink
            v-if="auth.isAdmin"
            to="/admin"
            class="text-xs font-semibold px-2.5 py-1 bg-amber-100 text-amber-800 rounded-md hover:bg-amber-200 transition"
          >
            Dashboard Admin
          </RouterLink>

          <!-- Compte Utilisateur -->
          <div v-if="auth.isAuthenticated" class="flex items-center gap-3">
            <span class="text-xs font-medium text-slate-600 hidden sm:inline">
              Bonjour, {{ auth.user?.name.split(' ')[0] }}
            </span>
            <button
              @click="handleLogout"
              class="text-xs font-medium text-slate-500 hover:text-red-600 transition"
            >
              Déconnexion
            </button>
          </div>
          <RouterLink
            v-else
            to="/login"
            class="text-sm font-medium text-slate-700 hover:text-slate-900 transition flex items-center gap-1"
          >
            Connexion
          </RouterLink>

          <!-- Bouton Panier avec badge réactif -->
          <RouterLink
            to="/cart"
            class="relative p-2 text-slate-800 hover:text-slate-950 transition rounded-full hover:bg-slate-100"
            aria-label="Voir le panier"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>

            <!-- Badge Quantité -->
            <span
              v-if="cart.totalItems > 0"
              class="absolute -top-1 -right-1 bg-slate-900 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse"
            >
              {{ cart.totalItems }}
            </span>
          </RouterLink>
        </div>
      </div>
    </div>
  </header>
</template>
