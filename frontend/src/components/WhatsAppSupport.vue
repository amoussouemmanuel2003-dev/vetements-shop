<script setup>
import { ref } from 'vue';

// Numéro WhatsApp du vendeur (Format international sans le +, ex: 2250700000000 pour la Côte d'Ivoire)
// Vous pouvez modifier ce numéro à tout moment avec votre propre numéro Orange, MTN ou Moov/Wave !
const SELLER_WHATSAPP_NUMBER = '2250500581207';

const isOpen = ref(false);

const openWhatsApp = (customText = '') => {
  const message = customText || 'Bonjour Atelier Mode, je suis sur votre boutique en ligne et j’aimerais avoir des informations sur vos articles à 2 000 FCFA.';
  const url = `https://api.whatsapp.com/send?phone=${SELLER_WHATSAPP_NUMBER}&text=${encodeURIComponent(message)}`;
  window.location.href = url;
};
</script>

<template>
  <!-- Widget Flottant WhatsApp Anti-Arnaque -->
  <aside aria-label="Support WhatsApp" class="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
    <!-- Bulle de rassurance qui s'affiche -->
    <div
      v-if="isOpen"
      class="bg-white p-4 rounded-2xl shadow-xl border border-slate-100 max-w-xs text-xs space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      <div class="flex items-center justify-between border-b pb-2">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span class="font-bold text-slate-900">Vendeur Certifié 🇨🇮</span>
        </div>
        <button @click="isOpen = false" class="text-slate-400 hover:text-slate-600 font-bold cursor-pointer">✕</button>
      </div>
      <p class="text-slate-600 leading-relaxed">
        Peur d’une arnaque ? Échangez directement avec le gérant de la boutique sur WhatsApp avant ou après votre commande !
      </p>
      <div class="pt-1">
        <a
          :href="`https://api.whatsapp.com/send?phone=${SELLER_WHATSAPP_NUMBER}&text=${encodeURIComponent('Bonjour Atelier Mode, je suis sur votre boutique en ligne et j’aimerais avoir des informations sur vos articles à 2 000 FCFA.')}`"
          target="_blank"
          rel="noopener noreferrer"
          class="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition shadow-sm cursor-pointer"
        >
          <span>💬</span>
          <span>Discuter sur WhatsApp</span>
        </a>
      </div>
    </div>

    <!-- Bouton Flottant Principal -->
    <button
      @click="isOpen = !isOpen"
      class="bg-[#25D366] hover:bg-[#20ba59] text-white p-3.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 group transform hover:scale-105"
      aria-label="Contacter le vendeur sur WhatsApp"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 fill-current" viewBox="0 0 24 24">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
      </svg>
      <span class="text-xs font-bold hidden sm:inline">WhatsApp Vendeur</span>
      <span class="w-2.5 h-2.5 rounded-full bg-emerald-200 animate-ping sm:hidden"></span>
    </button>
  </aside>
</template>
