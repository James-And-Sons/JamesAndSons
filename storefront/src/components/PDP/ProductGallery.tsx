"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";

interface ProductGalleryProps {
  images: string[];
  productName: string;
  onOpenLightbox?: (index: number) => void;
}

export default function ProductGallery({
  images = [],
  productName,
  onOpenLightbox,
}: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="w-full aspect-square bg-surface2/60 border border-border/60 rounded-xl flex items-center justify-center text-textMuted text-xs font-mono">
        No Product Images
      </div>
    );
  }

  const currentImage = images[selectedIndex] || images[0];

  return (
    <div className="space-y-4">
      {/* Main Hero Image */}
      <div className="relative w-full aspect-square bg-background border border-border/80 rounded-xl overflow-hidden group shadow-md">
        <Image
          src={currentImage}
          alt={productName}
          fill
          priority
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Lightbox trigger */}
        <button
          type="button"
          onClick={() => onOpenLightbox?.(selectedIndex)}
          className="absolute top-3 right-3 p-2 bg-obsidian/70 backdrop-blur-md text-gold hover:text-white rounded-full border border-border/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          title="Zoom image"
        >
          <Maximize2 size={16} />
        </button>

        {/* Carousel Prev/Next Controls */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() =>
                setSelectedIndex((prev) =>
                  prev > 0 ? prev - 1 : images.length - 1,
                )
              }
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-obsidian/70 backdrop-blur-md text-cream hover:text-gold rounded-full border border-border/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() =>
                setSelectedIndex((prev) =>
                  prev < images.length - 1 ? prev + 1 : 0,
                )
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-obsidian/70 backdrop-blur-md text-cream hover:text-gold rounded-full border border-border/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails Row */}
      {images.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto pb-1 custom-scrollbar">
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              className={`w-16 h-16 relative rounded-lg border overflow-hidden shrink-0 transition-all cursor-pointer ${
                selectedIndex === idx
                  ? "border-gold ring-2 ring-gold/20 scale-105"
                  : "border-border/60 hover:border-gold/50 opacity-70 hover:opacity-100"
              }`}
            >
              <Image
                src={img}
                alt={`${productName} thumbnail ${idx + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
