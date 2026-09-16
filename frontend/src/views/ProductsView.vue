<script setup>
import { ref, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';
import ProductCard from '@/components/ProductCard.vue';

const route = useRoute();

const products = ref([]);
const loading = ref(true);

// État des filtres
const searchKeyword = ref(route.query.keyword || '');
const selectedCategory = ref(route.query.category || '');
const selectedSubcategory = ref(route.query.subcategory || '');
const selectedSize = ref(route.query.size || '');

const categories = ['Homme', 'Femme', 'Enfant', 'Accessoires'];
const subcategories = ['Chapeaux', 'Pantalons', 'Habits'];
const sizes = ['Unique', 'XS', 'S', 'M', 'L', 'XL', 'XXL'];

const fetchProducts = async () => {
  loading.value = true;
  try {
    const params = {};
    if (searchKeyword.value) params.keyword = searchKeyword.value;
    if (selectedCategory.value) params.category = selectedCategory.value;
    if (selectedSubcategory.value) params.subcategory = selectedSubcategory.value;
    if (selectedSize.value) params.size = selectedSize.value;

    const { data } = await axios.get('/api/products', { params });
    products.value = data.products ? data.products : (Array.isArray(data) ? data : []);
  } catch (error) {
    console.error('Erreur lors du chargement des articles:', error);
  } finally {
    loading.value = false;
  }
};

const resetFilters = () => {
  searchKeyword.value = '';
  selectedCategory.value = '';
  selectedSubcategory.value = '';
  selectedSize.value = '';
  fetchProducts();
};

watch(
  () => route.query,
  () => {
    selectedCategory.value = route.query.category || '';
    selectedSubcategory.value = route.query.subcategory || '';
    fetchProducts();
  }
);

onMounted(() => {
  fetchProducts();
});
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <!-- Bannière Prix Unique CIV -->
    <div class="mb-8 p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div class="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400 text-slate-950 rounded-full text-xs font-black uppercase mb-2">
          🇨🇮 Concept Prix Unique
        </div>
        <h1 class="text-2xl sm:text-3xl font-black tracking-tight">
          {{ selectedCategory ? `Rayon ${selectedCategory}` : 'Tous nos Habits, Chapeaux & Pantalons' }}
        </h1>
        <p class="text-sm text-slate-300 mt-1">
          Chaque article du magasin est fixé au tarif unique de <strong>2 000 FCFA</strong> !
        </p>
      </div>

      <div class="bg-white/10 backdrop-blur border border-white/20 px-6 py-3 rounded-2xl text-center">
        <span class="text-xs uppercase tracking-wider text-slate-300 block font-semibold">Prix Par Pièce</span>
        <span class="text-2xl font-black text-amber-300">2 000 FCFA</span>
      </div>
    </div>

    <!-- Barre d'outils / Recherche -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-200">
      <span class="text-sm text-slate-500 font-medium">
        {{ products.length }} modèle(s) disponible(s)
      </span>

      <div class="flex items-center gap-3">
        <input
          v-model="searchKeyword"
          @keyup.enter="fetchProducts"
          type="text"
          placeholder="Rechercher bob, cargo, robe..."
          class="px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
        />
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <!-- Filtres latéraux -->
      <aside class="space-y-6">
        <div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <div class="flex items-center justify-between">
            <h3 class="font-bold text-slate-900 text-sm">Filtres</h3>
            <button @click="resetFilters" class="text-xs text-rose-600 font-medium hover:underline">
              Réinitialiser
            </button>
          </div>

          <!-- Badge Prix Unique -->
          <div class="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs space-y-1">
            <p class="font-bold">🏷️ Tarif Fixe Garanti :</p>
            <p class="text-lg font-black text-amber-950">2 000 FCFA</p>
            <p class="text-[11px] text-amber-800 leading-tight">Aucune mauvaise surprise à la caisse, tout est à 2 000 F.</p>
          </div>

          <!-- Types d'articles (Chapeaux, Pantalons, Habits) -->
          <div>
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Type d'Article</h4>
            <div class="space-y-2">
              <label
                v-for="sub in subcategories"
                :key="sub"
                class="flex items-center gap-2 text-sm text-slate-700 cursor-pointer hover:text-slate-950"
              >
                <input
                  type="radio"
                  name="subcategory"
                  :value="sub"
                  v-model="selectedSubcategory"
                  @change="fetchProducts"
                  class="rounded text-slate-900 focus:ring-slate-900"
                />
                {{ sub }} (2 000 F)
              </label>
            </div>
          </div>

          <!-- Filtre Catégorie -->
          <div>
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Catégorie</h4>
            <div class="space-y-2">
              <label
                v-for="cat in categories"
                :key="cat"
                class="flex items-center gap-2 text-sm text-slate-700 cursor-pointer hover:text-slate-950"
              >
                <input
                  type="radio"
                  name="category"
                  :value="cat"
                  v-model="selectedCategory"
                  @change="fetchProducts"
                  class="rounded text-slate-900 focus:ring-slate-900"
                />
                {{ cat }}
              </label>
            </div>
          </div>

          <!-- Filtre Taille -->
          <div>
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Taille</h4>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="size in sizes"
                :key="size"
                @click="selectedSize = selectedSize === size ? '' : size; fetchProducts()"
                :class="[
                  'px-3 py-1 text-xs font-semibold rounded-lg border transition',
                  selectedSize === size
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                ]"
              >
                {{ size }}
              </button>
            </div>
          </div>
        </div>
      </aside>

      <!-- Grille des articles -->
      <main class="lg:col-span-3">
        <div v-if="loading" class="grid grid-cols-2 md:grid-cols-3 gap-6">
          <div v-for="n in 6" :key="n" class="animate-pulse bg-slate-200 rounded-2xl h-80"></div>
        </div>

        <div v-else-if="products.length > 0" class="grid grid-cols-2 md:grid-cols-3 gap-6">
          <ProductCard
            v-for="product in products"
            :key="product._id || product.id"
            :product="product"
          />
        </div>

        <div v-else class="text-center py-20 bg-white rounded-2xl border border-slate-100 p-8">
          <p class="text-slate-500 mb-4">Aucun article ne correspond à vos filtres.</p>
          <button
            @click="resetFilters"
            class="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800"
          >
            Afficher tous les articles à 2 000 FCFA
          </button>
        </div>
      </main>
    </div>
  </div>
</template>
