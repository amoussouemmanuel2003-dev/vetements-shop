# Atelier Mode — Plateforme E-Commerce de Vêtements (Full-Stack)

Application web e-commerce complète, moderne et sécurisée dédiée au prêt-à-porter et accessoires de mode.

## 🛠 Stack Technique

- **Frontend :** Vue.js 3 (Composition API avec `<script setup>`), Vite, Vue Router 4, Pinia (état global + synchronisation `localStorage`), Tailwind CSS.
- **Backend :** Node.js avec Express.js (Architecture REST MVC modulaire).
- **Base de données :** MongoDB avec Mongoose (modèles optimisés pour les variantes : tailles, coloris, stock).
- **Sécurité & Auth :** JSON Web Tokens (JWT) avec chiffrement des mots de passe par `bcryptjs`, middlewares de restriction de rôle (`user` vs `admin`).
- **Paiement :** Intégration de Stripe (création d'intention de paiement côté serveur et confirmation sécurisée).

---

## 📁 Architecture du Projet

```text
clothing-shop/
├── backend/
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── config/
│       │   └── db.js                  # Connexion Mongoose
│       ├── models/
│       │   ├── User.js                # Modèle utilisateur & hash bcrypt
│       │   ├── Product.js             # Modèle vêtement (tailles, couleurs, stock)
│       │   └── Order.js               # Modèle commande & transaction Stripe
│       ├── middlewares/
│       │   ├── authMiddleware.js      # Vérification JWT & rôle Admin
│       │   └── errorMiddleware.js     # Gestion centralisée des erreurs REST
│       ├── controllers/
│       │   ├── authController.js      # Inscription, connexion, profil
│       │   ├── productController.js   # Listing, filtres, recherche, CRUD
│       │   ├── orderController.js     # Création, calcul de prix serveur, historique
│       │   └── paymentController.js   # Création d'intention de paiement Stripe
│       ├── routes/
│       │   ├── authRoutes.js
│       │   ├── productRoutes.js
│       │   ├── orderRoutes.js
│       │   └── paymentRoutes.js
│       ├── utils/
│       │   └── seeder.js              # Script pour peupler la BDD de démo
│       └── server.js                  # Point d'entrée de l'API Express
├── frontend/
│   ├── package.json
│   ├── vite.config.js                 # Configuration Vite avec proxy /api
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── index.html
│   └── src/
│       ├── main.js                    # Initialisation Vue, Pinia, Router
│       ├── App.vue                    # Layout racine avec Navbar et Footer
│       ├── index.css                  # Directives Tailwind CSS
│       ├── stores/
│       │   ├── cart.js                # Panier réactif persisté dans localStorage
│       │   └── auth.js                # Authentification et état utilisateur
│       ├── router/
│       │   └── index.js               # Définition des routes et guards admin
│       ├── components/
│       │   ├── Navbar.vue             # Navigation, compteur panier réactif
│       │   └── ProductCard.vue        # Carte vêtement, sélecteur rapide taille/couleur
│       └── views/
│           ├── HomeView.vue           # Bannière, univers (Homme, Femme, Enfant)
│           ├── ProductsView.vue       # Catalogue avec filtres (taille, prix, tri)
│           ├── ProductDetailView.vue  # Fiche produit, galerie, gestion de stock
│           ├── CartView.vue           # Panier, jauge de livraison offerte
│           ├── CheckoutView.vue       # Formulaire de livraison et paiement Stripe
│           ├── LoginView.vue          # Inscription et connexion
│           └── AdminDashboardView.vue # CRUD produits et suivi commandes
└── README.md
```

---

## 🚀 Démarrage Rapide en Local

### 1. Prérequis
- **Node.js** (v18+)
- **MongoDB** en local (`mongodb://localhost:27017`) ou un cluster **MongoDB Atlas**
- Une clé de test Stripe (optionnelle pour tester l'API de base)

### 2. Démarrage du Backend
```bash
cd backend
npm install
cp .env.example .env

# Peupler la base avec des vêtements et des comptes de test
npm run seed

# Démarrer le serveur API
npm run dev
```
L'API s'exécute sur `http://localhost:5000`.

### 3. Démarrage du Frontend
Dans un autre terminal :
```bash
cd frontend
npm install
npm run dev
```
L'application web est accessible sur `http://localhost:5173`.

---

## 🔑 Comptes de Test Pré-configurés
- **Administrateur :** `admin@mode.com` / `Password123!`
- **Client :** `jane@client.com` / `Password123!`
