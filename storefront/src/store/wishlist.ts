import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@/lib/utils';

type WishlistStore = {
  items: Product[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  toggleItem: (product: Product) => void;
  itemCount: () => number;
};

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product) => {
        if (get().items.find(i => i.id === product.id)) return;
        set(state => ({ items: [...state.items, product] }));
      },

      removeItem: (productId) => {
        set(state => ({ items: state.items.filter(i => i.id !== productId) }));
      },

      isInWishlist: (productId) => {
        return !!get().items.find(i => i.id === productId);
      },

      toggleItem: (product) => {
        if (get().isInWishlist(product.id)) {
          get().removeItem(product.id);
        } else {
          get().addItem(product);
        }
      },

      itemCount: () => get().items.length,
    }),
    { name: 'jns-wishlist' }
  )
);
