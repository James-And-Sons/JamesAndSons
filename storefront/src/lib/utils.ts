export type Product = {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description: string;
  longDescription?: string;
  collection: string;
  mrp: number;
  d2cPrice: number;
  b2bPrice: number;
  isLed: boolean;
  luminousEfficacy?: number | null;
  cri?: number | null;
  gstRate: number;
  bisCertification?: string | null;
  hsnCode?: string | null;
  stockQuantity: number;
  weight?: number | null;
  dimensions?: { diameter: number; height: number };
  finishes: string[];
  spaces: string[];
  badge?: 'new' | 'bis' | 'sale' | 'b2b';
  specs: { label: string; value: string }[];
  images: string[];
  category?: { name: string; slug: string };
};

export function formatPrice(n: number): string {
  if (n >= 100000) return `₹${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)}L`;
  return `₹${n.toLocaleString('en-IN')}`;
}
