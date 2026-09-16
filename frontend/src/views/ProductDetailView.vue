<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';
import { useCartStore } from '@/stores/cart';

const route = useRoute();
const cart = useCartStore();

const product = ref(null);
const loading = ref(true);
const selectedImage = ref('');
const selectedSize = ref('');
const selectedColor = ref(null);
const quantity = ref(1);
const addedSuccess = ref(false);

const fetchProduct = async () => {
  loading.value = true;
  try {
    const { data } = await axios.get(`/api/products/${route.params.id}`);
    product.value = data;
    selectedImage.value = data.images?.[0] || data.image_url;
    selectedSize.value = data.sizes?.[0] || 'Unique';
    selectedColor.value = data.colors?.[0] || { name: 'Standard', hex: '#000000' };
  } catch (error) {
    console.error('Erreur lors du chargement de l’article:', error);
  } finally {
    loading.value = false;
  }
};

const handleAddToCart = () => {
  if (!product.value) return;
  try {
    cart.addToCart(product.value, selectedSize.value, selectedColor.value, quantity.value);
    addedSuccess.value = true;
    setTimeout(() => {
      addedSuccess.value = false;
    }, 2500);
  } catch (error) {
    alert(error.message);
  }
};

const whatsappProductUrl = computed(() => {
  if (!product.value) return '#';
  const sellerWhatsApp = '2250500581207';
  const name = product.value.name || product.value.title;
  const price = Math.round(product.value.price || 2000).toLocaleString('fr-FR');
  const size = selectedSize.value || 'Unique';
  const color = selectedColor.value?.name || 'Standard';

  const message = `Bonjour Atelier Mode ! 👋\n\nJe souhaite commander directement cet article vu sur votre boutique :\n• *${name}*\n• *Prix :* ${price} FCFA\n• *Taille :* ${size}\n• *Couleur :* ${color}\n• *Quantité :* ${quantity.value}\n\n👉 *Pouvez-vous me donner le numéro de téléphone pour faire le dépôt Mobile Money (Wave / Orange Money / MTN / Moov) ?* Merci !`;

  return `https://api.whatsapp.com/send?phone=${sellerWhatsApp}&text=${encodeURIComponent(message)}`;
});

const orderDirectWhatsApp = () => {
  window.location.href = whatsappProductUrl.value;
};

onMounted(() => {
  fetchProduct();
});
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <div v-if="loading" class="animate-pulse flex flex-col md:flex-row gap-12">
      <div class="md:w-1/2 h-96 bg-slate-200 rounded-3xl"></div>
      <div class="md:w-1/2 space-y-4">
        <div class="h-8 bg-slate-200 rounded w-3/4"></div>
        <div class="h-6 bg-slate-200 rounded w-1/4"></div>
        <div class="h-24 bg-slate-200 rounded"></div>
      </div>
    </div>

    <div v-else-if="product" class="grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
      <!-- Galerie Photos (7 cols) -->
      <div class="md:col-span-7 flex flex-col-reverse sm:flex-row gap-4">
        <!-- Miniatures -->
        <div class="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-visible">
          <button
            v-for="(img, idx) in (product.images || [product.image_url])"
            :key="idx"
            @click="selectedImage = img"
            :class="[
              'w-20 h-24 rounded-xl overflow-hidden border-2 transition flex-shrink-0',
              selectedImage === img ? 'border-slate-900 ring-2 ring-slate-900/10' : 'border-transparent opacity-70 hover:opacity-100'
            ]"
          >
            <img :src="img" :alt="product.name || product.title" class="w-full h-full object-cover" />
          </button>
        </div>

        <!-- Grande Image -->
        <div class="flex-grow aspect-[3/4] bg-slate-100 rounded-3xl overflow-hidden shadow-sm">
          <img :src="selectedImage" :alt="product.name || product.title" class="w-full h-full object-cover object-center" />
        </div>
      </div>

      <!-- Informations & Achat (5 cols) -->
      <div class="md:col-span-5 space-y-6">
        <div>
          <span class="text-xs font-bold tracking-widest text-slate-400 uppercase">
            {{ product.category }} · {{ product.subcategory || 'Prêt-à-porter' }}
          </span>
          <h1 class="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            {{ product.name || product.title }}
          </h1>
          <p class="text-3xl font-black text-slate-900 mt-3">
            {{ Math.round(product.price).toLocaleString('fr-FR') }} FCFA
          </p>
        </div>

        <p class="text-sm text-slate-600 leading-relaxed">
          {{ product.description }}
        </p>

        <!-- Choix de la couleur -->
        <div v-if="product.colors?.length > 0">
          <div class="flex justify-between text-xs font-bold mb-2 text-slate-700">
            <span>COULEUR</span>
            <span class="text-slate-500">{{ selectedColor?.name }}</span>
          </div>
          <div class="flex items-center gap-2">
            <button
              v-for="color in product.colors"
              :key="color.name"
              @click="selectedColor = color"
              :title="color.name"
              class="w-7 h-7 rounded-full border-2 transition-transform shadow-sm"
              :class="selectedColor?.name === color.name ? 'scale-110 border-slate-900 ring-2 ring-slate-400' : 'border-white hover:scale-105'"
              :style="{ backgroundColor: color.hex }"
            />
          </div>
        </div>

        <!-- Choix de la taille -->
        <div>
          <div class="flex justify-between text-xs font-bold mb-2 text-slate-700">
            <span>TAILLE</span>
            <span class="text-slate-500 font-normal underline cursor-pointer">Guide des tailles</span>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="size in (product.sizes || ['Unique'])"
              :key="size"
              @click="selectedSize = size"
              :class="[
                'px-4 py-2 text-xs font-bold rounded-xl border transition',
                selectedSize === size
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white text-slate-800 border-slate-200 hover:border-slate-400'
              ]"
            >
              {{ size }}
            </button>
          </div>
        </div>

        <!-- Disponibilité Stock -->
        <div class="text-xs flex items-center gap-2">
          <span class="w-2 h-2 rounded-full" :class="product.stock > 0 ? 'bg-emerald-500' : 'bg-rose-500'"></span>
          <span v-if="product.stock > 5" class="text-slate-600 font-medium">En stock · Livraison rapide Abidjan & intérieur</span>
          <span v-else-if="product.stock > 0" class="text-amber-600 font-semibold">Plus que {{ product.stock }} pièces restantes</span>
          <span v-else class="text-rose-600 font-semibold">Rupture de stock momentanée</span>
        </div>

        <!-- Bouton d'ajout au panier -->
        <div class="pt-2">
          <button
            @click="handleAddToCart"
            :disabled="product.stock <= 0"
            :class="[
              'w-full py-4 rounded-2xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-sm',
              product.stock <= 0
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : addedSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
            ]"
          >
            <span v-if="addedSuccess">Ajouté au panier avec succès ✓</span>
            <span v-else-if="product.stock <= 0">Épuisé</span>
            <span v-else>Ajouter au panier • {{ Math.round(product.price * quantity).toLocaleString('fr-FR') }} FCFA</span>
          </button>

          <!-- Bouton Commande Directe WhatsApp -->
          <a
            :href="whatsappProductUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="w-full mt-3 py-3.5 px-4 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg transition cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
            </svg>
            <span>Commander sur WhatsApp (Dépôt direct) 💬</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>
