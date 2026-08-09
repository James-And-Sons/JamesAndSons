"use client";

import { useCartStore } from "@/store/cart";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import CartDrawerItem from "./cart/CartDrawerItem";
import CartDrawerFooter from "./cart/CartDrawerFooter";
import { X, ShoppingBag, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import { renderPrice } from "@/lib/utils";

const FREE_SHIPPING_THRESHOLD = 5000;

export default function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    updateQty,
    itemCount,
    discountedTotal,
  } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close cart on pathname change
  useEffect(() => {
    closeCart();
  }, [pathname, closeCart]);

  // Keyboard close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [closeCart]);

  // Close cart on mobile back navigation
  useEffect(() => {
    if (!isOpen) return;
    const handlePopState = () => {
      closeCart();
    };
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isOpen, closeCart]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    } else {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    }
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!mounted) return null;

  const currentCount =
    typeof itemCount === "function" ? itemCount() : items.length;
  const grandTotal =
    typeof discountedTotal === "function"
      ? discountedTotal()
      : discountedTotal || 0;
  const amountNeededForFreeShipping = Math.max(
    0,
    FREE_SHIPPING_THRESHOLD - grandTotal,
  );
  const freeShippingProgress = Math.min(
    100,
    (grandTotal / FREE_SHIPPING_THRESHOLD) * 100,
  );

  return createPortal(
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={closeCart}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            zIndex: 9998,
            backdropFilter: "blur(4px)",
            transition: "opacity 0.3s ease",
          }}
        />
      )}

      {/* Drawer panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Shopping bag"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "420px",
          maxWidth: "100vw",
          background: "var(--obsidian)",
          borderLeft: "1px solid var(--border)",
          zIndex: 10000,
          display: "flex",
          flexDirection: "column",
          visibility: isOpen ? "visible" : "hidden",
          opacity: isOpen ? 1 : 0,
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition:
            "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease",
          pointerEvents: isOpen ? "auto" : "none",
          overscrollBehavior: "contain",
        }}
      >
        {/* Header */}
        <div className="p-6 pb-4 flex justify-between items-center shrink-0 border-b border-border/80 bg-surface/40">
          <div className="flex items-center gap-2.5">
            <ShoppingBag size={20} className="text-gold" />
            <h2 className="font-serif text-2xl font-light text-cream m-0 flex items-center gap-2">
              <span>Shopping Bag</span>
              <span className="text-xs font-mono text-gold bg-gold/15 px-2 py-0.5 rounded border border-gold/30">
                {currentCount}
              </span>
            </h2>
          </div>
          <button
            onClick={closeCart}
            aria-label="Close cart"
            className="p-1.5 text-gold/80 hover:text-gold hover:scale-110 transition-all cursor-pointer rounded-full hover:bg-gold/10"
          >
            <X size={20} />
          </button>
        </div>

        {/* Free Shipping Progress Bar */}
        {items.length > 0 && (
          <div className="px-6 py-3 bg-surface/70 border-b border-border/40 space-y-1.5 shrink-0">
            <div className="flex justify-between items-center text-[11px] font-mono">
              {amountNeededForFreeShipping > 0 ? (
                <span className="text-textMuted">
                  Add{" "}
                  <span className="text-gold font-bold">
                    {renderPrice(amountNeededForFreeShipping)}
                  </span>{" "}
                  more for a <span className="text-gold">Special discount</span>
                </span>
              ) : (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <Sparkles size={12} />
                  <span>Unlocked Special discount!</span>
                </span>
              )}
              <span className="text-textMuted text-[10px]">
                {Math.round(freeShippingProgress)}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-background rounded-full overflow-hidden border border-border/50">
              <div
                className="h-full bg-gradient-to-r from-gold/70 via-gold to-amber-300 transition-all duration-500 rounded-full"
                style={{ width: `${freeShippingProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Scrollable Items Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-obsidian custom-scrollbar">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16 space-y-4">
              <div className="w-16 h-16 rounded-full bg-surface border border-border/80 flex items-center justify-center text-gold shadow-lg shadow-gold/5">
                <ShoppingBag size={32} className="stroke-1" />
              </div>
              <div className="space-y-1">
                <h3 className="text-cream font-medium font-serif text-lg">
                  Your shopping bag is empty
                </h3>
                <p className="text-xs text-textMuted max-w-[260px] mx-auto">
                  Discover our heritage illumination craftsmanship &
                  architectural collections.
                </p>
              </div>
              <Link
                href="/collections"
                onClick={closeCart}
                className="mt-2 px-6 py-2.5 bg-gold text-obsidian font-mono text-xs uppercase tracking-widest font-bold rounded hover:brightness-110 transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-gold/15"
              >
                <span>Explore Catalog</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            items.map((item: any, idx: number) => (
              <CartDrawerItem
                key={item.product?.id || idx}
                item={item}
                onUpdateQty={updateQty}
                onRemove={removeItem}
                onCloseCart={closeCart}
              />
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && <CartDrawerFooter onCloseCart={closeCart} />}
      </div>
    </>,
    document.body,
  );
}
