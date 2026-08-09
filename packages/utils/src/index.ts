import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(n: number | null | undefined): string {
  if (n === null || n === undefined) return "₹0";
  if (n >= 100000) return `₹${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)}L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

export function formatPriceFull(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
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
  metadata?: Record<string, any>;
}

export type Product = IProduct & {
  isLed?: boolean;
  luminousEfficacy?: number | null;
  cri?: number | null;
  bisCertification?: string | null;
  bulbType?: string[];
  badge?: "new" | "bis" | "sale" | "b2b";
};

export function triggerHaptic() {
  if (typeof window !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(8);
    } catch {}
  }
}

export const GSTIN_STATE_CODES: Record<string, string> = {
  "01": "Jammu & Kashmir",
  "02": "Himachal Pradesh",
  "03": "Punjab",
  "04": "Chandigarh",
  "05": "Uttarakhand",
  "06": "Haryana",
  "07": "Delhi",
  "08": "Rajasthan",
  "09": "Uttar Pradesh",
  "10": "Bihar",
  "11": "Sikkim",
  "12": "Arunachal Pradesh",
  "13": "Nagaland",
  "14": "Manipur",
  "15": "Mizoram",
  "16": "Tripura",
  "17": "Meghalaya",
  "18": "Assam",
  "19": "West Bengal",
  "20": "Jharkhand",
  "21": "Odisha",
  "22": "Chhattisgarh",
  "23": "Madhya Pradesh",
  "24": "Gujarat",
  "25": "Daman & Diu",
  "26": "Dadra & Nagar Haveli",
  "27": "Maharashtra",
  "28": "Andhra Pradesh (Old)",
  "29": "Karnataka",
  "30": "Goa",
  "31": "Lakshadweep",
  "32": "Kerala",
  "33": "Tamil Nadu",
  "34": "Puducherry",
  "35": "Andaman & Nicobar Islands",
  "36": "Telangana",
  "37": "Andhra Pradesh",
  "38": "Ladakh",
  "97": "Other Territory",
  "99": "Centre Jurisdiction",
};

/**
 * Calculates the official Indian GSTIN checksum character using the Modulus-36 algorithm.
 */
export function calculateGstinChecksum(gstin14: string): string {
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const factor = [1, 2];
  let sum = 0;

  for (let i = 0; i < 14; i++) {
    const codePoint = chars.indexOf(gstin14[i]);
    if (codePoint === -1) return "";
    const digit = codePoint * factor[i % 2];
    sum += Math.floor(digit / 36) + (digit % 36);
  }

  const remainder = sum % 36;
  const checkCodePoint = (36 - remainder) % 36;
  return chars[checkCodePoint];
}

export interface GstinValidationResult {
  isValid: boolean;
  gstin: string;
  stateCode?: string;
  stateName?: string;
  pan?: string;
  checksumValid?: boolean;
  error?: string;
}

/**
 * Validates format, state code, PAN structure, and Modulus-36 checksum of a 15-digit GSTIN.
 */
export function validateGstinFormat(input: string): GstinValidationResult {
  const gstin = (input || "").trim().toUpperCase();

  if (!gstin) {
    return { isValid: false, gstin: "", error: "GSTIN number is required." };
  }

  if (gstin.length !== 15) {
    return {
      isValid: false,
      gstin,
      error: `GSTIN must be exactly 15 characters long (currently ${gstin.length}).`,
    };
  }

  const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!regex.test(gstin)) {
    return {
      isValid: false,
      gstin,
      error: "Invalid GSTIN format. Expected pattern: e.g. 09AABCJ8243A1ZX",
    };
  }

  const stateCode = gstin.substring(0, 2);
  const stateName = GSTIN_STATE_CODES[stateCode];
  if (!stateName) {
    return {
      isValid: false,
      gstin,
      stateCode,
      error: `Invalid state code '${stateCode}' in GSTIN.`,
    };
  }

  const pan = gstin.substring(2, 12);
  const calculatedCheck = calculateGstinChecksum(gstin.substring(0, 14));
  const expectedCheck = gstin[14];
  const checksumValid = calculatedCheck === expectedCheck;

  if (!checksumValid) {
    return {
      isValid: false,
      gstin,
      stateCode,
      stateName,
      pan,
      checksumValid: false,
      error: `Checksum verification failed for GSTIN. (Expected '${calculatedCheck}', got '${expectedCheck}')`,
    };
  }

  return {
    isValid: true,
    gstin,
    stateCode,
    stateName,
    pan,
    checksumValid: true,
  };
}
