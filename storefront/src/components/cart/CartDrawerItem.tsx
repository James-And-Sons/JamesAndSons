"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { renderPrice } from "@/lib/utils";
import { useWishlistStore } from "@/store/wishlist";
import { Heart, Trash2, Minus, Plus } from "lucide-react";

interface CartDrawerItemProps {
  item: any;
  onUpdateQty: (productId: string, qty: number, planSku?: string) => void;
  onRemove: (productId: string, planSku?: string) => void;
  onCloseCart: () => void;
}

export default function CartDrawerItem({
  item,
  onUpdateQty,
  onRemove,
  onCloseCart,
}: CartDrawerItemProps) {
  const { toggleItem, isInWishlist } = useWishlistStore();
  const product = item.product || {};
  const inWishlist = product.id ? isInWishlist(product.id) : false;

  const handleWishlistMove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.id) {
      toggleItem(product);
      onRemove(product.id, item.warranty?.planSku);
    }
  };

  const itemPrice = (product.d2cPrice || 0) * (item.quantity || 1);

  return (
    <div className="p-3.5 bg-surface/80 border border-border/80 rounded hover:border-gold/40 transition-all duration-300 shadow-sm flex gap-3 text-xs relative group">
      {/* Product Thumbnail */}
      <Link
        href={`/products/${product.slug || product.id}`}
        onClick={onCloseCart}
        className="w-16 h-20 bg-background border border-border/60 rounded overflow-hidden shrink-0 relative block"
      >
        {product.images && product.images[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name || "Product"}
            fill
            sizes="64px"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-surface2 flex items-center justify-center text-[10px] text-textMuted">
            No Image
          </div>
        )}
      </Link>

      {/* Item Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div className="space-y-1">
          <div className="flex justify-between items-start gap-2">
            <Link
              href={`/products/${product.slug || product.id}`}
              onClick={onCloseCart}
              className="font-serif font-medium text-cream hover:text-gold transition-colors text-xs leading-snug truncate block"
            >
              {product.name || "Untitled Product"}
            </Link>
            <button
              type="button"
              onClick={() => onRemove(product.id, item.warranty?.planSku)}
              className="text-textDim hover:text-rose-400 p-0.5 transition-colors cursor-pointer shrink-0"
              title="Remove item"
            >
              <Trash2 size={13} />
            </button>
          </div>

          {product.sku && (
            <p className="font-mono text-[9px] text-textMuted uppercase tracking-wider">
              SKU: {product.sku}
            </p>
          )}

          {item.warranty?.name && (
            <span className="inline-block px-1.5 py-0.5 text-[9px] font-mono bg-gold/10 text-gold rounded border border-gold/30">
              🛡 {item.warranty.name}
            </span>
          )}
        </div>

        {/* Quantity Controls & Price */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center bg-background border border-border/80 rounded-sm">
            <button
              type="button"
              onClick={() =>
                onUpdateQty(
                  product.id,
                  item.quantity - 1,
                  item.warranty?.planSku,
                )
              }
              className="px-2 py-1 text-textMuted hover:text-gold transition-colors cursor-pointer"
              aria-label="Decrease quantity"
            >
              <Minus size={11} />
            </button>
            <span className="px-2 font-mono text-[11px] text-cream min-w-[20px] text-center font-bold">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() =>
                onUpdateQty(
                  product.id,
                  item.quantity + 1,
                  item.warranty?.planSku,
                )
              }
              className="px-2 py-1 text-textMuted hover:text-gold transition-colors cursor-pointer"
              aria-label="Increase quantity"
            >
              <Plus size={11} />
            </button>
          </div>

          <span className="font-mono font-bold text-gold text-xs">
            {renderPrice(itemPrice)}
          </span>
        </div>

        {/* Wishlist Link */}
        <button
          type="button"
          onClick={handleWishlistMove}
          className="mt-1 text-[10px] font-mono uppercase tracking-wider text-textMuted hover:text-gold flex items-center gap-1 cursor-pointer transition-colors w-fit"
        >
          <Heart
            size={10}
            className={inWishlist ? "fill-gold text-gold" : "text-textMuted"}
          />
          <span>Move to wishlist</span>
        </button>
      </div>
    </div>
  );
}
