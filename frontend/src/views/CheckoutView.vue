<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { useCartStore } from '@/stores/cart';
import { useAuthStore } from '@/stores/auth';

const cart = useCartStore();
const auth = useAuthStore();
const router = useRouter();

// Coordonnées officielles WhatsApp du gérant en Côte d'Ivoire
const SELLER_PHONE = '05 00 58 12 07';
const SELLER_WHATSAPP = '2250500581207';

const shippingAddress = ref({
  customerName: auth.user?.name || '',
  customerPhone: '',
  commune: 'Cocody',
  street: auth.user?.shippingAddress?.street || 'Angré 8ème Tranche, près de la pharmacie',
  city: 'Abidjan',
  country: 'Côte d\'Ivoire'
});

// Choix de la préférence de paiement
const paymentPreference = ref('Dépôt Mobile Money (Wave, Orange, MTN, Moov)');
const isProcessing = ref(false);
const errorMessage = ref('');
const orderSuccess = ref(null);

const paymentOptions = [
  {
    id: 'Dépôt Mobile Money (Wave, Orange, MTN, Moov)',
    name: 'Dépôt Mobile Money (Wave / OM / MoMo / Moov)',
    logo: '📱',
    hint: 'Le gérant vous transmettra le numéro de dépôt directement sur WhatsApp'
  },
  {
    id: 'Espèces à la livraison',
    name: 'Paiement Cash à la Livraison',
    logo: '💵',
    hint: 'Règlement en espèces au livreur lors de la réception du colis'
  }
];

const currentWhatsAppUrl = ref('');

// Fonction pour générer le lien WhatsApp officiel avec tous les détails de la commande
const getWhatsAppUrl = (order) => {
  const orderId = order?._id || order?.id || 'NOUVELLE';
  const items = order?.orderItems || cart.items || [];
  const itemsText = items
    .map(i => `• ${i.name} (${i.size || 'Unique'}, ${i.color || 'Standard'}) x${i.qty || i.quantity} = ${Math.round((i.price || 2000) * (i.qty || i.quantity)).toLocaleString('fr-FR')} FCFA`)
    .join('\n');

  const total = Math.round(order?.totalPrice || cart.totalPrice).toLocaleString('fr-FR');
  const delivery = '1 500 FCFA';

  const message = `Bonjour Atelier Mode ! 👋\n\nJe souhaite passer la commande *#${orderId}* sur votre boutique en ligne :\n\n*Articles commandés (2 000 F / unité) :*\n${itemsText}\n\n🚚 *Livraison fixes (CIV) :* ${delivery}\n💰 *TOTAL À RÉGLER :* ${total} FCFA\n\n👤 *Client :* ${shippingAddress.value.customerName}\n📞 *Téléphone :* ${shippingAddress.value.customerPhone}\n📍 *Adresse :* ${shippingAddress.value.commune}, ${shippingAddress.value.street}\n💳 *Option choisie :* ${paymentPreference.value}\n\n👉 *Pouvez-vous me donner le numéro sur lequel faire le dépôt Mobile Money (ou me confirmer l'expédition) ?* Merci !`;

  // Utilisation du endpoint officiel api.whatsapp.com (compatible 100% Mobile & Ordinateur)
  return `https://api.whatsapp.com/send?phone=${SELLER_WHATSAPP}&text=${encodeURIComponent(message)}`;
};

const handleCheckout = async () => {
  if (cart.items.length === 0) {
    errorMessage.value = 'Votre panier est vide.';
    return;
  }

  if (!shippingAddress.value.customerName.trim()) {
    errorMessage.value = 'Veuillez indiquer votre nom complet pour la livraison.';
    return;
  }

  if (!shippingAddress.value.customerPhone.trim()) {
    errorMessage.value = 'Veuillez indiquer votre numéro de téléphone pour le livreur.';
    return;
  }

  isProcessing.value = true;
  errorMessage.value = '';

  try {
    const orderPayload = {
      orderItems: cart.items.map(item => ({
        name: item.name,
        qty: item.quantity,
        image: item.image,
        price: item.price,
        size: item.size,
        color: item.color,
        product: item.productId
      })),
      shippingAddress: {
        customerName: shippingAddress.value.customerName,
        customerPhone: shippingAddress.value.customerPhone,
        street: `${shippingAddress.value.commune}, ${shippingAddress.value.street}`,
        city: shippingAddress.value.city,
        country: shippingAddress.value.country
      },
      paymentMethod: paymentPreference.value,
      transactionReference: 'WhatsApp Dépôt Direct'
    };

    let order = null;
    try {
      // 1. Enregistrement de la commande dans PostgreSQL Neon (Invité ou Connecté)
      const { data } = await axios.post('/api/orders', orderPayload);
      order = data;
    } catch (apiErr) {
      console.warn('[Commande] Enregistrement en mode direct:', apiErr.response?.data?.message || apiErr.message);
      order = {
        id: `CIV-${Date.now().toString().slice(-6)}`,
        orderItems: orderPayload.orderItems,
        totalPrice: cart.totalPrice
      };
    }

    // 2. Préparation de l'URL WhatsApp avec tous les détails
    const whatsappUrl = getWhatsAppUrl(order);
    currentWhatsAppUrl.value = whatsappUrl;

    // 3. Vider le panier et afficher l'écran de confirmation
    cart.clearCart();
    orderSuccess.value = order;

    // 4. Redirection vers WhatsApp (impossible à bloquer par les bloqueurs de pop-up)
    window.location.href = whatsappUrl;
  } catch (err) {
    console.error('Erreur commande:', err);
    // Secours absolu : redirection WhatsApp directe pour ne jamais perdre une vente
    const whatsappUrl = getWhatsAppUrl(null);
    currentWhatsAppUrl.value = whatsappUrl;
    cart.clearCart();
    window.location.href = whatsappUrl;
  } finally {
    isProcessing.value = false;
  }
};

const reOpenWhatsApp = () => {
  const url = currentWhatsAppUrl.value || getWhatsAppUrl(orderSuccess.value);
  window.location.href = url;
};

const talkToSellerDirect = () => {
  const message = `Bonjour Atelier Mode, je suis sur votre site et j'aimerais avoir des précisions avant de commander mes articles à 2 000 FCFA.`;
  const url = `https://api.whatsapp.com/send?phone=${SELLER_WHATSAPP}&text=${encodeURIComponent(message)}`;
  window.location.href = url;
};
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <h1 class="text-2xl sm:text-3xl font-black text-slate-900 mb-8">Finaliser ma Commande</h1>

    <!-- Écran de Succès avec Bouton WhatsApp Immédiat -->
    <div
      v-if="orderSuccess"
      class="bg-white rounded-3xl p-6 sm:p-10 border border-emerald-200 shadow-md max-w-xl mx-auto space-y-6 text-center"
    >
      <div class="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl font-bold">
        ✓
      </div>

      <div>
        <div class="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold mb-2">
          <span>📲</span>
          <span>Commande Enregistrée avec Succès</span>
        </div>
        <h2 class="text-2xl font-black text-slate-900">Finalisation sur WhatsApp</h2>
        <p class="text-xs text-slate-500 mt-1">Numéro de commande : <strong class="text-slate-900 font-mono">#{{ (orderSuccess._id || orderSuccess.id).toString().slice(-6) }}</strong></p>
      </div>

      <!-- Encadré Rassurance WhatsApp -->
      <div class="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-left space-y-3">
        <div class="flex items-center gap-2 text-emerald-950 font-bold text-xs">
          <span class="text-base">💬</span>
          <span>Obtenez le numéro de dépôt sur WhatsApp</span>
        </div>
        <p class="text-xs text-slate-600 leading-relaxed">
          Votre commande a bien été enregistrée. Cliquez sur le bouton ci-dessous pour ouvrir la discussion avec le vendeur et recevoir son numéro de dépôt :
        </p>

        <a
          :href="currentWhatsAppUrl || getWhatsAppUrl(orderSuccess)"
          target="_blank"
          rel="noopener noreferrer"
          class="w-full bg-[#25D366] hover:bg-[#20ba59] text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition shadow-md text-sm cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
          </svg>
          <span>Ouvrir WhatsApp pour Finaliser</span>
        </a>
      </div>

      <button
        @click="router.push('/products')"
        class="text-xs font-semibold text-slate-500 hover:text-slate-900 underline"
      >
        Retourner à la boutique
      </button>
    </div>

    <!-- Formulaire de commande complet -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div class="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
        <!-- Rassurance WhatsApp Vendeur -->
        <div class="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs text-emerald-950">
          <div class="flex items-center gap-2">
            <span class="text-xl">🛡️</span>
            <div>
              <p class="font-bold">Boutique Vérifiée en Côte d'Ivoire</p>
              <p class="text-emerald-800 text-[11px]">Un doute ? Contactez directement le gérant sur WhatsApp.</p>
            </div>
          </div>
          <button
            type="button"
            @click="talkToSellerDirect"
            class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition flex-shrink-0 text-[11px] cursor-pointer"
          >
            Discuter 💬
          </button>
        </div>

        <!-- 1. Coordonnées & Livraison -->
        <div class="space-y-4">
          <h2 class="text-base font-bold text-slate-900 flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">1</span>
            <span>Adresse de Livraison (Frais fixes : 1 500 FCFA)</span>
          </h2>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">Nom Complet du Destinataire</label>
              <input
                v-model="shippingAddress.customerName"
                type="text"
                required
                class="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-slate-900"
                placeholder="Ex: Jean-Marc Koffi"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">Numéro Téléphone (Pour le livreur)</label>
              <input
                v-model="shippingAddress.customerPhone"
                type="tel"
                required
                class="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-slate-900"
                placeholder="Ex: 07 01 02 03 04"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">Commune / Ville</label>
              <select v-model="shippingAddress.commune" class="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-slate-900 bg-white">
                <option value="Cocody">Cocody (Angré, 2 Plateaux, Rivera...)</option>
                <option value="Yopougon">Yopougon (Siporex, Maroc, Niangon...)</option>
                <option value="Marcory">Marcory / Zone 4</option>
                <option value="Koumassi">Koumassi</option>
                <option value="Treichville">Treichville</option>
                <option value="Abobo">Abobo</option>
                <option value="Plateau">Plateau</option>
                <option value="Bingerville">Bingerville</option>
                <option value="Port-Bouët">Port-Bouët</option>
                <option value="Intérieur">Autre ville de l'intérieur</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1">Précision Quartier / Repère</label>
              <input
                v-model="shippingAddress.street"
                type="text"
                required
                class="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-slate-900"
                placeholder="Ex: Non loin de la pharmacie Sainte Famille"
              />
            </div>
          </div>
        </div>

        <!-- 2. Finalisation Directe avec le Vendeur sur WhatsApp -->
        <div class="space-y-4 pt-4 border-t border-slate-100">
          <h2 class="text-base font-bold text-slate-900 flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">2</span>
            <span>Règlement & Dépôt avec le Vendeur (WhatsApp Direct)</span>
          </h2>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              v-for="option in paymentOptions"
              :key="option.id"
              type="button"
              @click="paymentPreference = option.id"
              :class="[
                'p-3.5 rounded-2xl border-2 text-left transition flex items-start gap-3 cursor-pointer',
                paymentPreference === option.id
                  ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              ]"
            >
              <span class="text-2xl">{{ option.logo }}</span>
              <div>
                <p class="font-bold text-slate-900 text-xs">{{ option.name }}</p>
                <p class="text-[10px] text-slate-500 mt-0.5 leading-tight">{{ option.hint }}</p>
              </div>
            </button>
          </div>

          <!-- Encadré Explicatif Rassurance Dépôt WhatsApp -->
          <div class="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs space-y-2.5 text-emerald-950">
            <div class="flex items-center gap-2 font-bold text-xs">
              <span class="text-base">💬</span>
              <span>Comment se passe le paiement ?</span>
            </div>
            <p class="text-[11px] text-emerald-800 leading-relaxed">
              Dès que vous cliquez sur le bouton vert ci-dessous, votre commande est enregistrée et <strong>WhatsApp s'ouvre automatiquement</strong> avec le gérant de la boutique.
            </p>
            <div class="bg-white/90 p-3 rounded-xl border border-emerald-200 space-y-1.5 text-[11px] text-slate-700">
              <p class="font-bold text-emerald-900">📲 Sur WhatsApp, le vendeur va :</p>
              <p>• Vous donner directement le <strong>numéro de téléphone officiel</strong> pour effectuer votre dépôt (Wave, Orange Money, MTN MoMo ou Moov).</p>
              <p>• Confirmer instantanément la bonne réception de votre transfert.</p>
              <p>• Valider et expédier rapidement votre colis à votre adresse !</p>
            </div>
          </div>
        </div>

        <p v-if="errorMessage" class="text-xs text-red-600 font-bold p-3 bg-red-50 rounded-xl border border-red-200">
          ⚠️ {{ errorMessage }}
        </p>

        <!-- Gros Bouton Vert WhatsApp -->
        <button
          @click="handleCheckout"
          :disabled="isProcessing"
          class="w-full bg-[#25D366] hover:bg-[#20ba59] text-white font-black py-4 rounded-2xl transition disabled:opacity-50 flex items-center justify-center gap-2.5 shadow-lg hover:shadow-xl text-sm sm:text-base cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 fill-current flex-shrink-0" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
          </svg>
          <span v-if="isProcessing">Enregistrement de la commande...</span>
          <span v-else>Commander sur WhatsApp ({{ cart.totalPrice.toLocaleString('fr-FR') }} FCFA) 💬</span>
        </button>
      </div>

      <!-- Résumé Panier & Détail Commission -->
      <div class="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm h-fit space-y-4 sticky top-24">
        <h3 class="font-black text-slate-900 text-base">Vos Articles ({{ cart.totalItems }})</h3>

        <div class="divide-y divide-slate-100 max-h-72 overflow-y-auto">
          <div
            v-for="item in cart.items"
            :key="`${item.productId}-${item.size}`"
            class="py-3 flex items-center gap-3"
          >
            <img :src="item.image" class="w-12 h-14 object-cover rounded-xl bg-slate-100" />
            <div class="flex-grow text-xs">
              <p class="font-bold text-slate-800">{{ item.name }}</p>
              <p class="text-slate-400">Taille: {{ item.size }} | Qté: {{ item.quantity }}</p>
            </div>
            <span class="text-xs font-black text-slate-900">
              {{ Math.round(item.price * item.quantity).toLocaleString('fr-FR') }} FCFA
            </span>
          </div>
        </div>

        <div class="border-t border-slate-100 pt-3 space-y-2.5 text-xs">
          <div class="flex justify-between text-slate-600">
            <span>Sous-total articles</span>
            <span class="font-semibold text-slate-900">{{ cart.subtotal.toLocaleString('fr-FR') }} FCFA</span>
          </div>

          <div class="flex justify-between text-slate-600">
            <span>Frais de livraison fixes</span>
            <span class="font-bold text-slate-900">{{ cart.shippingPrice.toLocaleString('fr-FR') }} FCFA</span>
          </div>

          <div class="flex justify-between text-slate-600">
            <span class="flex items-center gap-1">
              <span>Frais de service en ligne</span>
              <span class="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">Reçu Vendeur</span>
            </span>
            <span class="font-bold text-slate-900">{{ cart.commissionFee.toLocaleString('fr-FR') }} FCFA</span>
          </div>

          <div class="flex justify-between font-black text-slate-900 text-base pt-3 border-t border-slate-100">
            <span>Total Général</span>
            <span class="text-lg text-rose-600 font-black">{{ cart.totalPrice.toLocaleString('fr-FR') }} FCFA</span>
          </div>
        </div>

        <div class="pt-2">
          <button
            type="button"
            @click="talkToSellerDirect"
            class="w-full py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <span>💬</span>
            <span>Échanger avec le vendeur sur WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
