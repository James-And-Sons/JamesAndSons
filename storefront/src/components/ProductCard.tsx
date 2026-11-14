"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/cart";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug?: string;
    sku?: string;
    d2cPrice?: number;
    mrp?: number;
    images?: string[];
    stockQuantity?: number;
    category?: { name?: string };
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCartStore();
  const price = product.d2cPrice || product.mrp || 0;
  const mrp = product.mrp && product.mrp > price ? product.mrp : null;
  const mainImage =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images[0]
      : null;
  const targetSlug = product.slug || product.id;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product as any, 1);
  };

  return (
    <div className="group relative bg-[var(--surface)] border border-[var(--border)] rounded-[20px] overflow-hidden hover:border-[var(--gold)]/50 transition-all duration-300 shadow-sm flex flex-col justify-between hover:-translate-y-1">
      {/* Product Image Frame */}
      <Link
        href={`/products/${targetSlug}`}
        className="block relative aspect-square bg-[#12100a] overflow-hidden"
      >
        {mainImage ? (
          <Image
            src={mainImage}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center font-serif text-[var(--gold)] text-xl font-bold">
            J&amp;S
          </div>
        )}

        {/* Category Pill Tag */}
        {product.category?.name && (
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xs text-[10px] font-mono text-[var(--gold-light)] uppercase tracking-wider border border-white/10">
            {product.category.name}
          </div>
        )}
      </Link>

      {/* Product Details & Actions */}
      <div className="p-4 sm:p-5 flex flex-col justify-between flex-1">
        <div>
          <Link
            href={`/products/${targetSlug}`}
            className="text-base font-serif font-medium text-[var(--cream)] group-hover:text-[var(--gold)] transition-colors line-clamp-1 text-decoration-none"
          >
            {product.name}
          </Link>
          {product.sku && (
            <div className="text-[11px] font-mono text-[var(--text-muted)] mt-1">
              SKU: {product.sku}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--border)]/40">
          <div>
            <div className="text-sm font-bold font-mono text-[var(--gold)]">
              {formatPrice(price)}
            </div>
            {mrp && (
              <div className="text-[11px] font-mono text-[var(--text-muted)] line-through">
                {formatPrice(mrp)}
              </div>
            )}
          </div>

          <button
            onClick={handleQuickAdd}
            className="p-2.5 rounded-xl bg-[rgba(196,160,90,0.12)] hover:bg-[var(--gold)] text-[var(--gold)] hover:text-black transition-all cursor-pointer border border-[rgba(196,160,90,0.3)] shadow-xs"
            title="Quick Add to Cart"
          >
            <ShoppingBag size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
