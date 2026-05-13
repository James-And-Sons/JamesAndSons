import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@/lib/utils';

export type CartItem = {
  product: Product;
  quantity: number;
};

export type AppliedCoupon = {
  couponId: string;
  code: string;
  discountAmount: number;
  freeShipping: boolean;
  description: string;
};

type CartStore = {
  items: CartItem[];
  isOpen: boolean;
  appliedCoupon: AppliedCoupon | null;
  openCart: () => void;
  closeCart: () => void;
  addItem: (product: Product, qty?: number) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  total: () => number;
  itemCount: () => number;
  applyCoupon: (coupon: AppliedCoupon) => void;
  removeCoupon: () => void;
  discountedTotal: () => number;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      appliedCoupon: null,

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

      clearCart: () => set({ items: [], appliedCoupon: null }),

      total: () => get().items.reduce((sum, i) => sum + i.product.d2cPrice * i.quantity, 0),

      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      applyCoupon: (coupon) => set({ appliedCoupon: coupon }),

      removeCoupon: () => set({ appliedCoupon: null }),

      discountedTotal: () => {
        const subtotal = get().total();
        const discount = get().appliedCoupon?.discountAmount ?? 0;
        return Math.max(0, subtotal - discount);
      },
    }),
    { name: 'jns-cart' }
  )
);
