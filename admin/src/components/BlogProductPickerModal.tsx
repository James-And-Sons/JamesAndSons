"use client";

import React, { useState } from "react";

export type SimpleProduct = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  collection?: string | null;
  d2cPrice?: number | null;
  images?: string[];
  whiteBackgroundImages?: string[];
};

interface BlogProductPickerModalProps {
  isOpen: boolean;
  mode: "card" | "photo";
  products: SimpleProduct[];
  onSelectProductCard: (product: SimpleProduct) => void;
  onSelectProductPhoto: (product: SimpleProduct, photoUrl: string) => void;
  onClose: () => void;
}

export default function BlogProductPickerModal({
  isOpen,
  mode,
  products,
  onSelectProductCard,
  onSelectProductPhoto,
  onClose,
}: BlogProductPickerModalProps) {
  const [search, setSearch] = useState("");
  const [selectedProductForPhoto, setSelectedProductForPhoto] =
    useState<SimpleProduct | null>(null);

  if (!isOpen) return null;

  const searchQuery = search.trim().toLowerCase();

  const filteredProducts = products.filter((p) => {
    if (!searchQuery) return true;
    return (
      p.name.toLowerCase().includes(searchQuery) ||
      p.sku.toLowerCase().includes(searchQuery) ||
      (p.collection && p.collection.toLowerCase().includes(searchQuery)) ||
      p.slug.toLowerCase().includes(searchQuery)
    );
  });

  const handleProductClick = (product: SimpleProduct) => {
    if (mode === "card") {
      onSelectProductCard(product);
      onClose();
    } else {
      // Photo mode: step to photo selection sub-view
      setSelectedProductForPhoto(product);
    }
  };

  const handlePhotoClick = (product: SimpleProduct, url: string) => {
    onSelectProductPhoto(product, url);
    setSelectedProductForPhoto(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#0F0D0A] border border-[var(--border-gold,#c9a84c)]/40 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-fadeIn">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#171410]">
          <div>
            <h3 className="font-serif text-xl text-primary font-light tracking-wide m-0">
              {selectedProductForPhoto
                ? `Select Photo for "${selectedProductForPhoto.name}"`
                : mode === "card"
                  ? "Select Product to Embed Shoppable Card"
                  : "Select Product for Clickable Photo Link"}
            </h3>
            <p className="font-mono text-[10px] text-muted uppercase tracking-widest mt-1">
              {selectedProductForPhoto
                ? "Click any photo to insert as clickable product link"
                : `Browsing ${filteredProducts.length} published products`}
            </p>
          </div>

          <button
            onClick={() => {
              setSelectedProductForPhoto(null);
              onClose();
            }}
            className="text-muted hover:text-white text-lg p-2 bg-white/5 rounded-lg border border-white/10"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        {selectedProductForPhoto ? (
          /* Sub-View: Select Photo from Product Gallery */
          <div className="p-6 overflow-y-auto space-y-4 flex-1">
            <button
              onClick={() => setSelectedProductForPhoto(null)}
              className="font-mono text-[10px] uppercase tracking-wider text-accent flex items-center gap-1 hover:underline mb-2"
            >
              ← Back to Product List
            </button>

            {(() => {
              const allPhotos = [
                ...(selectedProductForPhoto.images || []),
                ...(selectedProductForPhoto.whiteBackgroundImages || []),
              ].filter(Boolean);

              if (allPhotos.length === 0) {
                return (
                  <div className="p-12 text-center font-mono text-xs text-muted uppercase tracking-widest border border-dashed border-white/10 rounded-xl">
                    No images available for this product
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {allPhotos.map((url, idx) => (
                    <div
                      key={idx}
                      onClick={() =>
                        handlePhotoClick(selectedProductForPhoto, url)
                      }
                      className="group relative aspect-square rounded-xl overflow-hidden border border-white/10 bg-black/50 cursor-pointer hover:border-accent transition-all shadow-lg"
                    >
                      <img
                        src={url}
                        alt={`${selectedProductForPhoto.name} photo ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 text-center">
                        <span className="font-mono text-[10px] text-accent uppercase tracking-widest font-bold bg-black/80 px-3 py-1.5 rounded-full border border-accent/40">
                          Select Photo ↗
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        ) : (
          /* Main View: Search & Product List */
          <div className="flex-1 flex flex-col overflow-hidden p-6 space-y-4">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search products by name, SKU, or collection..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#1A1712] border border-white/15 px-4 py-3 pl-10 font-mono text-xs text-primary rounded-xl focus:outline-none focus:border-accent transition-colors"
                autoFocus
              />
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted text-sm">
                🔍
              </span>
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Product Grid */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-2">
              {filteredProducts.length === 0 ? (
                <div className="p-12 text-center font-mono text-xs text-muted uppercase tracking-widest border border-dashed border-white/10 rounded-xl">
                  No matching products found
                </div>
              ) : (
                filteredProducts.map((p) => {
                  const thumb = p.images?.[0] || p.whiteBackgroundImages?.[0];

                  return (
                    <div
                      key={p.id}
                      onClick={() => handleProductClick(p)}
                      className="p-3.5 rounded-xl bg-[#171410] border border-white/10 hover:border-accent hover:bg-[#201C16] transition-all cursor-pointer flex items-center justify-between gap-4 group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-black/40 border border-white/10 flex-shrink-0 flex items-center justify-center">
                          {thumb ? (
                            <img
                              src={thumb}
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="font-serif text-xs text-muted">
                              JS
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-mono text-[9px] uppercase tracking-wider text-accent truncate">
                            {p.collection || "Catalog Item"} · SKU: {p.sku}
                          </div>
                          <div className="font-serif text-base text-primary truncate group-hover:text-accent transition-colors">
                            {p.name}
                          </div>
                          <div className="font-mono text-xs text-muted">
                            {p.d2cPrice
                              ? `₹${p.d2cPrice.toLocaleString()}`
                              : "Price on request"}
                          </div>
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        <span className="font-mono text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-md bg-accent/15 text-accent border border-accent/30 font-bold group-hover:bg-accent group-hover:text-black transition-all">
                          {mode === "card" ? "+ Embed Card" : "Pick Photo →"}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
