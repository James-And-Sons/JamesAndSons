import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(n: number | null | undefined): string {
  if (n === null || n === undefined) return '₹0';
  if (n >= 100000) return `₹${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)}L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

export function formatPriceFull(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

export interface IProduct {
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
  gstRate: number;
  hsnCode?: string | null;
  stockQuantity: number;
  weight?: number | null;
  dimensions?: string | null;
  materialAndFinish: string[];
  style: string[];
  finishes: string[];
  spaces: string[];
  specs: { label: string; value: string }[] | any;
  images: string[];
  whiteBackgroundImages?: string[];
  category?: { name: string; slug: string };
  // Extendable specs metadata dictionary
  metadata?: Record<string, any>;
}
