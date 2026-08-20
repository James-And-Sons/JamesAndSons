import { formatPrice as sharedFormatPrice, IProduct } from '@james-andsons/utils';
import React from 'react';

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

// Render price with a dimmed decimal part (e.g. ₹12,345.00)
export function renderPrice(n: number | null | undefined): React.ReactNode {
  if (n === null || n === undefined) {
    return React.createElement('span', null, 
      '₹0', 
      React.createElement('span', { style: { opacity: 0.5, fontSize: '0.85em' } }, '.00')
    );
  }
  
  // Format to 2 decimal places
  const fixed = n.toFixed(2);
  const [integerPart, decimalPart] = fixed.split('.');
  
  // Format the integer part with Indian locale
  const formattedInteger = Number(integerPart).toLocaleString('en-IN');
  
  return React.createElement('span', null,
    `₹${formattedInteger}`,
    React.createElement('span', { style: { opacity: 0.5, fontSize: '0.85em' } }, `.${decimalPart}`)
  );
}

// Trigger subtle web haptic vibration feedback
export function triggerHaptic() {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(8);
    } catch {}
  }
}
