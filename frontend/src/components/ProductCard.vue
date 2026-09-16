<script setup>
import { ref } from 'vue';
import { RouterLink } from 'vue-router';
import { useCartStore } from '@/stores/cart';

const props = defineProps({
  product: {
    type: Object,
    required: true
  }
});

const cartStore = useCartStore();
const selectedSize = ref(props.product.sizes?.[0] || 'M');
const selectedColor = ref(props.product.colors?.[0] || { name: 'Standard', hex: '#000000' });
const isAdded = ref(false);

const handleQuickAdd = () => {
  try {
    cartStore.addToCart(props.product, selectedSize.value, selectedColor.value, 1);
    isAdded.value = true;
    setTimeout(() => {
      isAdded.value = false;
    }, 1800);
  } catch (error) {
    alert(error.message);
  }
};

const openCardWhatsApp = (event) => {
  if (event) event.stopPropagation();
  const sellerWhatsApp = '2250500581207';
  const name = props.product.name || props.product.title;
  const price = Math.round(props.product.price || 2000).toLocaleString('fr-FR');
  const size = selectedSize.value || 'Unique';
  const color = selectedColor.value?.name || 'Standard';

  const message = `Bonjour Atelier Mode ! 👋\n\nJe suis intéressé(e) par cet article :\n• *${name}* (${price} FCFA)\n• Taille : ${size}\n• Couleur : ${color}\n\n👉 *Pouvez-vous me donner votre numéro pour le dépôt Mobile Money (Wave, Orange, MTN, Moov) ?* Merci !`;

  const url = `https://api.whatsapp.com/send?phone=${sellerWhatsApp}&text=${encodeURIComponent(message)}`;
  window.location.href = url;
};
</script>

<template>
  <div class="group relative bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
    <!-- Image & Badges -->
    <div class="relative aspect-[3/4] overflow-hidden bg-slate-100">
      <img
        :src="product.images?.[0] || product.image_url || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=600&q=80'"
        :alt="product.name || product.title"
        class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
        loading="lazy"
      />

      <!-- Badge Catégorie -->
      <span class="absolute top-3 left-3 bg-white/90 backdrop-blur-md text-xs font-semibold text-slate-800 px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
        {{ product.category }}
      </span>

      <!-- Badge En Vedette -->
      <span v-if="product.is_featured || product.isFeatured" class="absolute top-3 right-3 bg-slate-900 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm">
        Top Vente
      </span>

      <!-- Sélecteur rapide de taille au survol -->
      <div class="absolute bottom-3 inset-x-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/95 backdrop-blur p-2 rounded-xl flex items-center justify-between gap-1 shadow-md">
        <span class="text-[11px] font-medium text-slate-500">Taille :</span>
        <div class="flex gap-1 overflow-x-auto py-0.5">
          <button
            v-for="size in (product.sizes || ['Unique'])"
            :key="size"
            @click.prevent="selectedSize = size"
            :class="[
              'text-xs font-semibold px-2 py-0.5 rounded transition-colors',
              selectedSize === size
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            ]"
          >
            {{ size }}
          </button>
        </div>
      </div>
    </div>

    <!-- Contenu & Informations -->
    <div class="p-4 flex flex-col flex-grow">
      <!-- Couleurs disponibles -->
      <div class="flex items-center gap-1.5 mb-2">
        <button
          v-for="color in (product.colors || [{ name: 'Standard', hex: '#000000' }])"
          :key="color.name"
          @click="selectedColor = color"
          :title="color.name"
          class="w-4 h-4 rounded-full border-2 transition-transform"
          :class="selectedColor?.name === color.name ? 'scale-125 border-slate-900 ring-1 ring-slate-400' : 'border-white hover:scale-110'"
          :style="{ backgroundColor: color.hex }"
        />
        <span class="text-[11px] text-slate-400 ml-1">({{ product.colors?.length || 1 }} coloris)</span>
      </div>

      <!-- Titre du vêtement -->
      <RouterLink :to="`/product/${product._id || product.id}`" class="group-hover:text-slate-600 transition-colors">
        <h3 class="font-semibold text-slate-900 text-sm line-clamp-1 mb-1">
          {{ product.name || product.title }}
        </h3>
      </RouterLink>

      <p class="text-xs text-slate-500 line-clamp-1 mb-3">
        {{ product.subcategory || product.description }}
      </p>

      <!-- Prix en FCFA et Ajout au panier -->
      <div class="mt-auto pt-2 flex items-center justify-between border-t border-slate-50">
        <div>
          <span class="text-[10px] uppercase font-bold text-slate-400">Prix CIV</span>
          <p class="text-base font-black text-slate-900">
            {{ Math.round(product.price).toLocaleString('fr-FR') }} FCFA
          </p>
        </div>

        <div class="flex items-center gap-1.5">
          <button
            type="button"
            @click.prevent="openCardWhatsApp"
            title="Discuter & Commander sur WhatsApp"
            class="p-2 rounded-lg bg-[#25D366] hover:bg-[#20ba59] text-white transition flex items-center justify-center cursor-pointer shadow-xs"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
            </svg>
          </button>

          <button
            @click="handleQuickAdd"
            :disabled="product.stock <= 0"
            :class="[
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1.5 cursor-pointer',
              product.stock <= 0
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : isAdded
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
            ]"
          >
            <span v-if="product.stock <= 0">Épuisé</span>
            <span v-else-if="isAdded">Ajouté ✓</span>
            <span v-else>+ Panier</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
