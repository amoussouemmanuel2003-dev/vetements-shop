<script setup>
import { RouterLink } from 'vue-router';
import { useCartStore } from '@/stores/cart';

const cart = useCartStore();
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <h1 class="text-2xl sm:text-3xl font-bold text-slate-900 mb-8">
      Mon Panier ({{ cart.totalItems }} article{{ cart.totalItems > 1 ? 's' : '' }})
    </h1>

    <!-- Panier vide -->
    <div
      v-if="cart.items.length === 0"
      class="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm p-8 max-w-lg mx-auto"
    >
      <div class="w-20 h-20 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      </div>
      <h2 class="text-xl font-bold text-slate-800 mb-2">Votre panier est vide</h2>
      <p class="text-slate-500 text-sm mb-6">
        Tous nos habits, chapeaux et pantalons sont à <strong>2 000 FCFA</strong> l'unité !
      </p>
      <RouterLink
        to="/products"
        class="inline-block bg-slate-900 text-white font-medium px-6 py-3 rounded-xl hover:bg-slate-800 transition"
      >
        Découvrir le catalogue
      </RouterLink>
    </div>

    <!-- Grille Panier avec articles et récapitulatif -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <!-- Liste des articles (8 cols) -->
      <div class="lg:col-span-8 space-y-4">
        <!-- Bandeau d'information Livraison & Sécurité Vendeur CIV -->
        <div class="bg-slate-900 text-white rounded-2xl p-4 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div class="flex items-center gap-2.5">
            <span class="text-xl">🚚</span>
            <div>
              <p class="font-bold text-slate-100">Frais de livraison fixes : 1 500 FCFA</p>
              <p class="text-slate-400 text-[11px]">Expédition rapide partout à Abidjan et villes de l'intérieur</p>
            </div>
          </div>
          <div class="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl font-bold text-[11px]">
            <span>🛡️</span>
            <span>Garantie Vendeur Vérifié</span>
          </div>
        </div>

        <!-- Lignes du panier -->
        <div class="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100 shadow-sm overflow-hidden">
          <div
            v-for="(item, index) in cart.items"
            :key="`${item.productId}-${item.size}-${item.color}`"
            class="p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-4 sm:gap-6"
          >
            <!-- Image Produit -->
            <img
              :src="item.image"
              :alt="item.name"
              class="w-24 h-28 object-cover rounded-xl bg-slate-100 flex-shrink-0"
            />

            <!-- Infos Vêtement -->
            <div class="flex-grow text-center sm:text-left space-y-1">
              <h3 class="font-semibold text-slate-900 text-base">{{ item.name }}</h3>
              <div class="flex items-center justify-center sm:justify-start gap-3 text-xs text-slate-500">
                <span class="bg-slate-100 px-2 py-0.5 rounded font-medium text-slate-700">Taille : {{ item.size }}</span>
                <span>Couleur : {{ item.color }}</span>
              </div>
              <p class="font-bold text-slate-900 text-sm mt-1 sm:hidden">
                {{ Math.round(item.price * item.quantity).toLocaleString('fr-FR') }} FCFA
              </p>
            </div>

            <!-- Contrôle Quantité -->
            <div class="flex items-center border border-slate-200 rounded-lg overflow-hidden">
              <button
                @click="cart.updateQuantity(index, item.quantity - 1)"
                class="px-3 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold transition"
                aria-label="Diminuer quantité"
              >
                -
              </button>
              <span class="px-4 py-1 text-sm font-semibold text-slate-800 min-w-[2.5rem] text-center">
                {{ item.quantity }}
              </span>
              <button
                @click="cart.updateQuantity(index, item.quantity + 1)"
                :disabled="item.quantity >= item.maxStock"
                class="px-3 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold disabled:opacity-40 transition"
                aria-label="Augmenter quantité"
              >
                +
              </button>
            </div>

            <!-- Prix & Suppression -->
            <div class="text-right hidden sm:block min-w-[6rem]">
              <span class="text-base font-black text-slate-900">
                {{ Math.round(item.price * item.quantity).toLocaleString('fr-FR') }} FCFA
              </span>
              <p class="text-xs text-slate-400">2 000 FCFA / u</p>
            </div>

            <button
              @click="cart.removeFromCart(index)"
              class="text-slate-400 hover:text-red-500 transition p-1"
              title="Supprimer l'article"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        <div class="flex justify-between items-center pt-2">
          <RouterLink to="/products" class="text-sm font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1">
            ← Continuer mes achats
          </RouterLink>
          <button @click="cart.clearCart" class="text-xs font-semibold text-red-600 hover:underline">
            Vider le panier
          </button>
        </div>
      </div>

      <!-- Résumé de la commande (4 cols) -->
      <div class="lg:col-span-4 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm sticky top-24 space-y-4">
        <h2 class="text-lg font-bold text-slate-900 border-b pb-3">
          Récapitulatif Commande
        </h2>

        <div class="space-y-3 text-xs sm:text-sm">
          <div class="flex justify-between text-slate-600">
            <span>Sous-total articles ({{ cart.totalItems }})</span>
            <span class="font-bold text-slate-800">{{ cart.subtotal.toLocaleString('fr-FR') }} FCFA</span>
          </div>

          <div class="flex justify-between text-slate-600">
            <span>Frais de livraison (CIV)</span>
            <span class="font-bold text-slate-800">{{ cart.shippingPrice.toLocaleString('fr-FR') }} FCFA</span>
          </div>

          <div class="flex justify-between text-slate-600">
            <span class="flex items-center gap-1">
              <span>Frais de service en ligne</span>
              <span class="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">Wave/OM</span>
            </span>
            <span class="font-bold text-slate-800">{{ cart.commissionFee.toLocaleString('fr-FR') }} FCFA</span>
          </div>

          <div class="border-t border-slate-100 pt-3 flex justify-between text-base font-bold text-slate-900">
            <span>Total net à régler</span>
            <span class="text-xl text-rose-600 font-black">{{ cart.totalPrice.toLocaleString('fr-FR') }} FCFA</span>
          </div>
        </div>

        <RouterLink
          to="/checkout"
          class="mt-6 w-full block text-center bg-[#25D366] hover:bg-[#20ba59] text-white font-black py-4 px-4 rounded-xl transition shadow-md hover:shadow-lg text-sm sm:text-base flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 fill-current flex-shrink-0" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
          </svg>
          <span>Commander sur WhatsApp ({{ cart.totalPrice.toLocaleString('fr-FR') }} FCFA)</span>
        </RouterLink>

        <div class="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-950 space-y-1">
          <p class="font-bold flex items-center gap-1">
            <span>🛡️</span>
            <span>Finalisation 100% Sécurisée WhatsApp :</span>
          </p>
          <p class="text-emerald-800">Le vendeur vous donnera directement son numéro officiel pour effectuer votre dépôt (Wave, Orange, MTN, Moov).</p>
        </div>
      </div>
    </div>
  </div>
</template>
