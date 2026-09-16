<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const activeTab = ref('products'); // 'products' ou 'orders'
const products = ref([]);
const orders = ref([]);
const loading = ref(true);

// Références pour les inputs de fichiers
const fileInput = ref(null);
const cameraInput = ref(null);
const isUploadingImage = ref(false);
const imageInputMode = ref('upload'); // 'upload' ou 'url'

// Formulaire nouveau vêtement adapté en FCFA (prix unique 2000 FCFA)
const showCreateModal = ref(false);
const newProduct = ref({
  name: '',
  description: '',
  price: 2000, // Prix fixe 2000 FCFA
  category: 'Accessoires',
  subcategory: 'Chapeaux',
  images: ['https://images.unsplash.com/photo-1576871337622-98d48d1cf531?auto=format&fit=crop&w=600&q=80'],
  sizes: ['Unique'],
  colors: [{ name: 'Noir', hex: '#000000' }],
  stock: 20,
  isFeatured: false
});

// Fonction pour compresser automatiquement l'image capturée par le smartphone
const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 900;
        const MAX_HEIGHT = 1100;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Compression JPEG optimisée pour le web et mobile
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
        resolve(compressedDataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

// Gestionnaire d'importation de photo (Appareil photo ou Galerie)
const handleImageFile = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  isUploadingImage.value = true;
  try {
    const compressedUrl = await compressImage(file);
    newProduct.value.images = [compressedUrl];
    newProduct.value.image_url = compressedUrl;
  } catch (err) {
    console.error('Erreur lors du traitement de la photo:', err);
    alert('Erreur lors du traitement de la photo. Veuillez réessayer.');
  } finally {
    isUploadingImage.value = false;
    event.target.value = '';
  }
};

const triggerCamera = () => {
  if (cameraInput.value) {
    cameraInput.value.click();
  }
};

const triggerFilePicker = () => {
  if (fileInput.value) {
    fileInput.value.click();
  }
};

const loadData = async () => {
  loading.value = true;
  try {
    const [prodRes, orderRes] = await Promise.all([
      axios.get('/api/products?limit=50'),
      axios.get('/api/orders')
    ]);
    products.value = prodRes.data.products ? prodRes.data.products : (Array.isArray(prodRes.data) ? prodRes.data : []);
    orders.value = Array.isArray(orderRes.data) ? orderRes.data : [];
  } catch (error) {
    console.error('Erreur chargement admin:', error);
  } finally {
    loading.value = false;
  }
};

const handleCreateProduct = async () => {
  try {
    const { data } = await axios.post('/api/products', newProduct.value);
    products.value.unshift(data);
    showCreateModal.value = false;
    alert('Article ajouté au catalogue avec succès !');
  } catch (err) {
    alert(err.response?.data?.message || 'Erreur lors de la création');
  }
};

const handleDeleteProduct = async (id) => {
  if (confirm('Êtes-vous certain de vouloir supprimer cet article ?')) {
    try {
      await axios.delete(`/api/products/${id}`);
      products.value = products.value.filter(p => (p._id || p.id) !== id);
    } catch (err) {
      alert('Erreur lors de la suppression');
    }
  }
};

const handleStatusChange = async (orderId, newStatus) => {
  try {
    await axios.put(`/api/orders/${orderId}/status`, { status: newStatus });
    const order = orders.value.find(o => (o._id || o.id) === orderId);
    if (order) order.orderStatus = newStatus;
  } catch (err) {
    alert('Erreur de mise à jour du statut');
  }
};

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
      <div>
        <h1 class="text-3xl font-black text-slate-900">Administration E-Commerce (CIV)</h1>
        <p class="text-xs text-slate-500 mt-1">Gestion du catalogue à 2 000 FCFA et suivi des commandes</p>
      </div>

      <!-- Sélecteur d'onglets -->
      <div class="flex bg-slate-200/70 p-1 rounded-xl">
        <button
          @click="activeTab = 'products'"
          :class="['px-4 py-1.5 text-xs font-bold rounded-lg transition', activeTab === 'products' ? 'bg-white shadow text-slate-900' : 'text-slate-600 hover:text-slate-900']"
        >
          Articles ({{ products.length }})
        </button>
        <button
          @click="activeTab = 'orders'"
          :class="['px-4 py-1.5 text-xs font-bold rounded-lg transition', activeTab === 'orders' ? 'bg-white shadow text-slate-900' : 'text-slate-600 hover:text-slate-900']"
        >
          Commandes ({{ orders.length }})
        </button>
      </div>
    </div>

    <!-- Onglet Produits -->
    <div v-if="activeTab === 'products'" class="space-y-6">
      <div class="flex justify-between items-center">
        <h2 class="text-lg font-bold text-slate-900">Catalogue des Articles (2 000 FCFA)</h2>
        <button
          @click="showCreateModal = true"
          class="bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-slate-800 transition shadow-sm"
        >
          + Ajouter un Article
        </button>
      </div>

      <!-- Modal Création avec Prise de Photo Téléphone -->
      <div v-if="showCreateModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
          <div class="flex justify-between items-center border-b pb-3">
            <div>
              <h3 class="font-black text-slate-900 text-lg">Ajouter un Article</h3>
              <p class="text-[11px] text-slate-500">Prenez une photo avec votre smartphone ou choisissez depuis la galerie</p>
            </div>
            <button @click="showCreateModal = false" class="text-slate-400 hover:text-slate-700 text-lg font-bold">✕</button>
          </div>

          <form @submit.prevent="handleCreateProduct" class="space-y-3 text-xs">
            <div>
              <label class="block font-semibold mb-1 text-slate-700">Nom de l'article</label>
              <input v-model="newProduct.name" type="text" required placeholder="Ex: Casquette NY Noire, Pantalon Cargo..." class="w-full border border-slate-200 p-2.5 rounded-xl focus:ring-2 focus:ring-slate-900" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold mb-1 text-slate-700">Catégorie</label>
                <select v-model="newProduct.category" class="w-full border border-slate-200 p-2.5 rounded-xl bg-white">
                  <option value="Homme">Homme</option>
                  <option value="Femme">Femme</option>
                  <option value="Enfant">Enfant</option>
                  <option value="Accessoires">Accessoires</option>
                </select>
              </div>
              <div>
                <label class="block font-semibold mb-1 text-slate-700">Sous-catégorie</label>
                <select v-model="newProduct.subcategory" class="w-full border border-slate-200 p-2.5 rounded-xl bg-white">
                  <option value="Chapeaux">Chapeaux & Bobs</option>
                  <option value="Pantalons">Pantalons & Jeans</option>
                  <option value="Habits">Habits & T-Shirts</option>
                  <option value="Accessoires">Accessoires</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold mb-1 text-slate-700">Prix Fixe (FCFA)</label>
                <input v-model.number="newProduct.price" type="number" readonly class="w-full border border-slate-200 p-2.5 rounded-xl bg-slate-100 font-bold text-slate-900" />
              </div>
              <div>
                <label class="block font-semibold mb-1 text-slate-700">Stock Initial</label>
                <input v-model.number="newProduct.stock" type="number" min="1" required class="w-full border border-slate-200 p-2.5 rounded-xl" />
              </div>
            </div>

            <div>
              <label class="block font-semibold mb-1 text-slate-700">Description</label>
              <textarea v-model="newProduct.description" required rows="2" placeholder="Description de l'article, matière, confort..." class="w-full border border-slate-200 p-2.5 rounded-xl"></textarea>
            </div>

            <!-- SECTION PHOTO SMARTPHONE -->
            <div class="pt-2 border-t border-slate-100">
              <div class="flex justify-between items-center mb-2">
                <label class="block font-bold text-slate-900">Photo de l'article</label>
                <div class="flex gap-2 text-[11px]">
                  <button
                    type="button"
                    @click="imageInputMode = 'upload'"
                    :class="imageInputMode === 'upload' ? 'font-bold text-slate-900 underline' : 'text-slate-400'"
                  >
                    Téléphone / Galerie
                  </button>
                  <span>|</span>
                  <button
                    type="button"
                    @click="imageInputMode = 'url'"
                    :class="imageInputMode === 'url' ? 'font-bold text-slate-900 underline' : 'text-slate-400'"
                  >
                    Lien Web (URL)
                  </button>
                </div>
              </div>

              <!-- Mode Upload Téléphone (Appareil photo + Galerie) -->
              <div v-if="imageInputMode === 'upload'" class="space-y-3">
                <!-- Inputs cachés pour déclencher l'appareil photo ou la galerie -->
                <input
                  ref="cameraInput"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  class="hidden"
                  @change="handleImageFile"
                />
                <input
                  ref="fileInput"
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="handleImageFile"
                />

                <div class="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    @click="triggerCamera"
                    :disabled="isUploadingImage"
                    class="py-3 px-3 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-1.5 transition shadow-sm"
                  >
                    <span>📸</span>
                    <span>Prendre une photo</span>
                  </button>

                  <button
                    type="button"
                    @click="triggerFilePicker"
                    :disabled="isUploadingImage"
                    class="py-3 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl flex items-center justify-center gap-1.5 transition"
                  >
                    <span>🖼️</span>
                    <span>Depuis la galerie</span>
                  </button>
                </div>

                <p v-if="isUploadingImage" class="text-[11px] text-amber-600 font-semibold text-center animate-pulse">
                  ⏳ Traitement et optimisation de la photo en cours...
                </p>

                <!-- Prévisualisation de l'image sélectionnée -->
                <div v-if="newProduct.images?.[0]" class="flex items-center gap-3 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                  <img :src="newProduct.images[0]" class="w-14 h-16 object-cover rounded-lg bg-white border" />
                  <div class="flex-grow">
                    <span class="text-emerald-700 font-bold block">✓ Photo prête pour l'article</span>
                    <span class="text-slate-400 text-[10px]">Optimisée automatiquement pour mobile</span>
                  </div>
                </div>
              </div>

              <!-- Mode Saisie URL classique -->
              <div v-else>
                <input
                  v-model="newProduct.images[0]"
                  type="text"
                  required
                  placeholder="https://images.unsplash.com/..."
                  class="w-full border border-slate-200 p-2.5 rounded-xl"
                />
              </div>
            </div>

            <div class="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button type="button" @click="showCreateModal = false" class="px-4 py-2 border rounded-xl font-medium text-slate-600">
                Annuler
              </button>
              <button
                type="submit"
                :disabled="isUploadingImage"
                class="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition disabled:opacity-50"
              >
                Enregistrer l'Article (2 000 FCFA)
              </button>
            </div>
          </form>
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 text-slate-500 border-b border-slate-100 font-semibold uppercase tracking-wider">
            <tr>
              <th class="p-4">Article</th>
              <th class="p-4">Catégorie</th>
              <th class="p-4">Prix FCFA</th>
              <th class="p-4">Stock</th>
              <th class="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="product in products" :key="product._id || product.id" class="hover:bg-slate-50/60">
              <td class="p-4 flex items-center gap-3">
                <img :src="product.images?.[0] || product.image_url" class="w-10 h-12 object-cover rounded-lg bg-slate-100" />
                <div>
                  <span class="font-bold text-slate-800 block">{{ product.name || product.title }}</span>
                  <span class="text-slate-400 text-[10px]">{{ product.subcategory || 'Prêt-à-porter' }}</span>
                </div>
              </td>
              <td class="p-4 font-medium text-slate-700">{{ product.category }}</td>
              <td class="p-4 font-black text-slate-900">{{ Math.round(product.price).toLocaleString('fr-FR') }} FCFA</td>
              <td class="p-4 font-semibold" :class="product.stock < 5 ? 'text-rose-600' : 'text-slate-700'">
                {{ product.stock }} unités
              </td>
              <td class="p-4 text-right">
                <button
                  @click="handleDeleteProduct(product._id || product.id)"
                  class="text-rose-600 hover:text-rose-800 font-semibold"
                >
                  Supprimer
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Onglet Commandes -->
    <div v-if="activeTab === 'orders'" class="space-y-6">
      <h2 class="text-lg font-bold text-slate-900">Suivi des Commandes (FCFA)</h2>
      <div class="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 text-slate-500 border-b border-slate-100 font-semibold uppercase tracking-wider">
            <tr>
              <th class="p-4">ID</th>
              <th class="p-4">Client</th>
              <th class="p-4">Articles</th>
              <th class="p-4">Total Payé</th>
              <th class="p-4">Statut</th>
              <th class="p-4">Mise à jour</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="order in orders" :key="order._id || order.id" class="hover:bg-slate-50/60">
              <td class="p-4 font-mono font-bold text-slate-700">#{{ (order._id || order.id).toString().slice(-4) }}</td>
              <td class="p-4">
                <span class="font-semibold text-slate-800 block">{{ order.user?.name || order.user_name || 'Client' }}</span>
                <span class="text-slate-400 text-[11px]">{{ order.user?.email || order.user_email }}</span>
              </td>
              <td class="p-4 text-slate-600">{{ (order.orderItems || order.order_items)?.length || 0 }} article(s)</td>
              <td class="p-4 font-black text-slate-900">{{ Math.round(order.totalPrice || order.total_price).toLocaleString('fr-FR') }} FCFA</td>
              <td class="p-4">
                <span
                  class="px-2.5 py-1 rounded-full text-[10px] font-bold"
                  :class="{
                    'bg-amber-100 text-amber-800': (order.orderStatus || order.order_status) === 'En attente',
                    'bg-emerald-100 text-emerald-800': (order.orderStatus || order.order_status) === 'Payée',
                    'bg-blue-100 text-blue-800': (order.orderStatus || order.order_status) === 'Expédiée',
                    'bg-slate-100 text-slate-800': (order.orderStatus || order.order_status) === 'Livrée'
                  }"
                >
                  {{ order.orderStatus || order.order_status }}
                </span>
              </td>
              <td class="p-4">
                <select
                  :value="order.orderStatus || order.order_status"
                  @change="handleStatusChange(order._id || order.id, $event.target.value)"
                  class="px-2 py-1 border border-slate-200 rounded text-xs bg-white text-slate-700 focus:outline-none"
                >
                  <option value="En attente">En attente</option>
                  <option value="Payée">Payée</option>
                  <option value="Expédiée">Expédiée</option>
                  <option value="Livrée">Livrée</option>
                </select>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
