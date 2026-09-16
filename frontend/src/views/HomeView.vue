<script setup>
import { ref, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import axios from 'axios';
import ProductCard from '@/components/ProductCard.vue';

const featuredProducts = ref([]);
const loading = ref(true);

const categories = [
  {
    title: 'Homme & Chapeaux',
    image: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=600&q=80',
    path: '/products?category=Homme'
  },
  {
    title: 'Femme & Robes',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=600&q=80',
    path: '/products?category=Femme'
  },
  {
    title: 'Pantalons & Accessoires',
    image: 'https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=600&q=80',
    path: '/products?category=Accessoires'
  }
];

onMounted(async () => {
  try {
    const { data } = await axios.get('/api/products/featured');
    featuredProducts.value = Array.isArray(data) ? data : (data.products || []);
  } catch (error) {
    console.error('Erreur de chargement des articles vedettes:', error);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="space-y-16 pb-16">
    <!-- Hero Banner avec prix Côte d'Ivoire (CIV) -->
    <section class="relative bg-slate-900 text-white overflow-hidden py-24 sm:py-32">
      <div class="absolute inset-0 opacity-40">
        <img
          src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1920&q=80"
          alt="Collection Mode Abidjan"
          class="w-full h-full object-cover object-center"
        />
      </div>
      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="max-w-2xl">
          <span class="inline-block px-3 py-1 bg-amber-400 text-slate-950 rounded-full text-xs font-black uppercase tracking-wider mb-4">
            🇨🇮 Spécial Côte d'Ivoire · Tout à moins de 2 000 FCFA
          </span>
          <h1 class="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight mb-6">
            Le Style Urbain au Meilleur Prix d'Abidjan.
          </h1>
          <p class="text-lg text-slate-300 mb-8 max-w-lg">
            Habits tendance, chapeaux, bobs et pantalons soignés. Prix accessibles plafonnés à <strong>2 000 FCFA maximum</strong>.
          </p>
          <div class="flex flex-wrap gap-4">
            <RouterLink
              to="/products"
              class="bg-white text-slate-950 px-8 py-3.5 rounded-xl font-bold hover:bg-slate-100 transition shadow-lg"
            >
              Voir Tout le Catalogue
            </RouterLink>
            <RouterLink
              to="/products?category=Homme"
              class="bg-white/10 backdrop-blur text-white border border-white/20 px-8 py-3.5 rounded-xl font-bold hover:bg-white/20 transition"
            >
              Chapeaux & Pantalons
            </RouterLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Catégories Vedettes -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h2 class="text-2xl font-bold text-slate-900 mb-6">Nos Rayons Populaires</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <RouterLink
          v-for="cat in categories"
          :key="cat.title"
          :to="cat.path"
          class="group relative h-96 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all"
        >
          <img
            :src="cat.image"
            :alt="cat.title"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
            <h3 class="text-2xl font-bold text-white mb-2">{{ cat.title }}</h3>
            <span class="text-sm text-amber-300 font-bold group-hover:underline flex items-center gap-1">
              Tout à 2 000 FCFA →
            </span>
          </div>
        </RouterLink>
      </div>
    </section>

    <!-- Articles Vedettes -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h2 class="text-2xl font-bold text-slate-900">Articles en Vedette</h2>
          <p class="text-slate-500 text-sm mt-1">Tous nos modèles à prix unique : 2 000 FCFA</p>
        </div>
        <RouterLink to="/products" class="text-sm font-semibold text-slate-900 hover:underline">
          Tout afficher →
        </RouterLink>
      </div>

      <div v-if="loading" class="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div v-for="n in 4" :key="n" class="animate-pulse bg-slate-200 rounded-2xl h-80"></div>
      </div>

      <div v-else-if="featuredProducts.length > 0" class="grid grid-cols-2 md:grid-cols-4 gap-6">
        <ProductCard
          v-for="product in featuredProducts"
          :key="product._id || product.id"
          :product="product"
        />
      </div>

      <div v-else class="text-center py-12 text-slate-400">
        Aucun article en vedette pour le moment.
      </div>
    </section>

    <!-- Avantages Reassurance CIV -->
    <section class="border-y border-slate-200 bg-white py-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
        <div>
          <div class="text-2xl mb-2">🚚</div>
          <h4 class="font-bold text-slate-900 mb-1">Livraison Gratuite dès 5 000 FCFA</h4>
          <p class="text-sm text-slate-500">Expédition rapide sur Abidjan et expédition dans toute la Côte d'Ivoire.</p>
        </div>
        <div>
          <div class="text-2xl mb-2">🏷️</div>
          <h4 class="font-bold text-slate-900 mb-1">Prix Plafonnés à 2 000 FCFA</h4>
          <p class="text-sm text-slate-500">Chapeaux, pantalons, chemises et accessoires au tarif le plus juste.</p>
        </div>
        <div>
          <div class="text-2xl mb-2">🔒</div>
          <h4 class="font-bold text-slate-900 mb-1">Paiement 100% Sécurisé</h4>
          <p class="text-sm text-slate-500">Règlement direct en Francs CFA (XOF) sans conversion de devises.</p>
        </div>
      </div>
    </section>
  </div>
</template>
