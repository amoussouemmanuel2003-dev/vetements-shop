<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const router = useRouter();

const isRegisterMode = ref(false);
const name = ref('');
const email = ref('');
const password = ref('');

const toggleMode = () => {
  isRegisterMode.value = !isRegisterMode.value;
  auth.error = null;
  name.value = '';
  email.value = '';
  password.value = '';
};

const handleSubmit = async () => {
  auth.error = null;
  let success = false;

  if (isRegisterMode.value) {
    if (!name.value.trim()) {
      auth.error = 'Veuillez renseigner votre nom complet.';
      return;
    }
    if (!email.value.trim()) {
      auth.error = 'Veuillez renseigner une adresse email.';
      return;
    }
    if (password.value.length < 6) {
      auth.error = 'Le mot de passe doit comporter au moins 6 caractères.';
      return;
    }
    success = await auth.register(name.value, email.value, password.value);
    if (success) {
      router.push('/products');
    }
  } else {
    success = await auth.login(email.value, password.value);
    if (success) {
      if (auth.isAdmin) {
        router.push('/admin');
      } else {
        router.push('/products');
      }
    }
  }
};
</script>

<template>
  <div class="min-h-[75vh] flex items-center justify-center px-4 py-12">
    <div class="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
      <div class="text-center">
        <h2 class="text-2xl font-bold text-slate-900">
          {{ isRegisterMode ? 'Créer un compte client' : 'Connexion' }}
        </h2>
        <p class="text-xs text-slate-500 mt-1">
          {{ isRegisterMode ? 'Rejoignez le Club Atelier Mode pour commander' : 'Accédez à votre compte ou dashboard admin' }}
        </p>
      </div>

      <!-- Notification d'erreur -->
      <div v-if="auth.error" class="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
        <span class="text-base leading-none">⚠️</span>
        <span>{{ auth.error }}</span>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div v-if="isRegisterMode">
          <label class="block text-xs font-semibold text-slate-600 mb-1">Nom Complet</label>
          <input
            v-model="name"
            type="text"
            required
            class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 bg-white"
            placeholder="Ex: Sophie Martin"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1">Adresse Email</label>
          <input
            v-model="email"
            type="email"
            required
            class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 bg-white"
            placeholder="votre@email.com"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1">Mot de passe</label>
          <input
            v-model="password"
            type="password"
            required
            class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 bg-white"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          :disabled="auth.loading"
          class="w-full bg-slate-900 text-white font-semibold py-3 rounded-xl hover:bg-slate-800 transition disabled:opacity-50 text-sm"
        >
          <span v-if="auth.loading">Traitement en cours...</span>
          <span v-else>{{ isRegisterMode ? "Créer mon compte" : 'Se connecter' }}</span>
        </button>
      </form>

      <div class="text-center pt-2">
        <button
          type="button"
          @click="toggleMode"
          class="text-xs font-medium text-slate-600 hover:text-slate-900 hover:underline"
        >
          {{ isRegisterMode ? 'Déjà client ? Se connecter' : 'Pas encore de compte ? S’inscrire' }}
        </button>
      </div>
    </div>
  </div>
</template>
