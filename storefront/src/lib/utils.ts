import { formatPrice as sharedFormatPrice, IProduct } from '@james-andsons/utils';

// Re-export the Product type alias for storefront files
export type Product = IProduct & {
  isLed: boolean;
  luminousEfficacy?: number | null;
  cri?: number | null;
  bisCertification?: string | null;
  bulbType: string[];
  badge?: 'new' | 'bis' | 'sale' | 'b2b';
};

// Re-export formatPrice helper
export function formatPrice(n: number | null | undefined): string {
  return sharedFormatPrice(n);
}

// Trigger subtle web haptic vibration feedback
export function triggerHaptic() {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(8);
    } catch {}
  }
}
