<script setup>
import { onMounted } from 'vue';
import Navbar from '@/components/Navbar.vue';
import WhatsAppSupport from '@/components/WhatsAppSupport.vue';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();

onMounted(() => {
  auth.initAuth();
});
</script>

<template>
  <div class="min-h-screen flex flex-col bg-slate-50 relative">
    <Navbar />

    <main class="flex-grow">
      <RouterView />
    </main>

    <!-- Widget Flottant WhatsApp Anti-Arnaque disponible sur tout le site -->
    <WhatsAppSupport />

    <footer class="bg-white border-t border-slate-200 mt-16 py-12 text-slate-500 text-xs">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p>© 2026 Atelier Mode — E-commerce Prêt-à-Porter Côte d'Ivoire (CIV). Tous droits réservés.</p>
        <div class="flex space-x-6">
          <a href="#" class="hover:text-slate-900 transition">Mentions légales</a>
          <a href="#" class="hover:text-slate-900 transition">Conditions Générales de Vente</a>
          <a href="#" class="hover:text-slate-900 transition">Politique de confidentialité</a>
        </div>
      </div>
    </footer>
  </div>
</template>
