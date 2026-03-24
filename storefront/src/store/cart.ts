import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@/lib/utils';

export type CartItem = {
  product: Product;
  quantity: number;
};

type CartStore = {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (product: Product, qty?: number) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  total: () => number;
  itemCount: () => number;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      addItem: (product, qty = 1) => {
        set(state => {
          const existing = state.items.find(i => i.product.id === product.id);
          if (existing) {
            return {
              items: state.items.map(i =>
                i.product.id === product.id ? { ...i, quantity: i.quantity + qty } : i
              ),
              isOpen: true,
            };
          }
          return { items: [...state.items, { product, quantity: qty }], isOpen: true };
        });
      },

      removeItem: (productId) => {
        set(state => ({ items: state.items.filter(i => i.product.id !== productId) }));
      },

      updateQty: (productId, qty) => {
        if (qty < 1) {
          get().removeItem(productId);
          return;
        }
        set(state => ({
          items: state.items.map(i => i.product.id === productId ? { ...i, quantity: qty } : i),
        }));
      },

      clearCart: () => set({ items: [] }),

      total: () => get().items.reduce((sum, i) => sum + i.product.d2cPrice * i.quantity, 0),

      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'jns-cart' }
  )
);
