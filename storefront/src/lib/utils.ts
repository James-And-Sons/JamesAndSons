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
  dimensions?: string | null;
  materialAndFinish: string[];
  bulbType: string[];
  style: string[];
  finishes: string[];
  spaces: string[];
  badge?: 'new' | 'bis' | 'sale' | 'b2b';
  specs: { label: string; value: string }[];
  images: string[];
  category?: { name: string; slug: string };
};

export function formatPrice(n: number | null | undefined): string {
  if (n === null || n === undefined) return '₹0';
  if (n >= 100000) return `₹${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)}L`;
  return `₹${n.toLocaleString('en-IN')}`;
}
