import { defineStore } from 'pinia';

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: JSON.parse(localStorage.getItem('cart_items')) || [],
    standardShippingFee: 1500 // Frais de livraison fixes : 1 500 FCFA
  }),

  getters: {
    // Nombre total d'articles dans le panier
    totalItems: (state) => {
      return state.items.reduce((total, item) => total + item.quantity, 0);
    },

    // Sous-total en FCFA (nombres entiers)
    subtotal: (state) => {
      return Math.round(
        state.items.reduce((total, item) => total + item.price * item.quantity, 0)
      );
    },

    // Frais de livraison fixes (1 500 FCFA)
    shippingPrice: (state) => {
      if (state.items.length === 0) return 0;
      return state.standardShippingFee;
    },

    // Frais de service / Commission de paiement en ligne (Wave, OM, MTN, Moov)
    commissionFee: (state) => {
      if (state.items.length === 0) return 0;
      if (state.subtotal <= 2000) return 50;  // 1 article : 50 FCFA
      if (state.subtotal <= 4000) return 100; // 2 articles : 100 FCFA
      return 200;                             // 3+ articles : 200 FCFA
    },

    // Total final en FCFA
    totalPrice: (state) => {
      return Math.round(state.subtotal + state.shippingPrice + state.commissionFee);
    }
  },

  actions: {
    saveToStorage() {
      localStorage.setItem('cart_items', JSON.stringify(this.items));
    },

    addToCart(product, size, color, quantity = 1) {
      if (!size) {
        throw new Error('Veuillez sélectionner une taille.');
      }

      const colorName = color?.name || color || 'Standard';

      const existingItemIndex = this.items.findIndex(
        (item) =>
          item.productId === product._id &&
          item.size === size &&
          item.color === colorName
      );

      if (existingItemIndex > -1) {
        const newQty = this.items[existingItemIndex].quantity + quantity;
        const maxStock = product.stock || 99;
        this.items[existingItemIndex].quantity = Math.min(newQty, maxStock);
      } else {
        this.items.push({
          productId: product._id,
          name: product.name || product.title,
          price: Math.round(Number(product.price)),
          image: product.images?.[0] || product.image_url,
          size: size,
          color: colorName,
          quantity: quantity,
          maxStock: product.stock || 99
        });
      }

      this.saveToStorage();
    },

    updateQuantity(index, quantity) {
      if (index >= 0 && index < this.items.length) {
        if (quantity <= 0) {
          this.removeFromCart(index);
        } else {
          const maxStock = this.items[index].maxStock || 99;
          this.items[index].quantity = Math.min(quantity, maxStock);
          this.saveToStorage();
        }
      }
    },

    removeFromCart(index) {
      if (index >= 0 && index < this.items.length) {
        this.items.splice(index, 1);
        this.saveToStorage();
      }
    },

    clearCart() {
      this.items = [];
      this.saveToStorage();
    }
  }
});
