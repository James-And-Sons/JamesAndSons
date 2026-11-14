"use client";

import React from "react";
import { Image as ImageIcon, Plus, Trash2 } from "lucide-react";

interface ProductMediaSectionProps {
  images: string[];
  whiteBackgroundImages?: string[];
  onAddImage: (url: string) => void;
  onRemoveImage: (index: number) => void;
}

export default function ProductMediaSection({
  images = [],
  whiteBackgroundImages = [],
  onAddImage,
  onRemoveImage,
}: ProductMediaSectionProps) {
  const [newUrl, setNewUrl] = React.useState("");

  const handleAdd = () => {
    if (newUrl.trim()) {
      onAddImage(newUrl.trim());
      setNewUrl("");
    }
  };

  return (
    <div className="p-6 bg-surface border border-border rounded-xl space-y-4 shadow-sm">
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <ImageIcon size={18} className="text-gold" />
        <h3 className="font-serif font-bold text-base text-text">
          Product Gallery & White Background Media
        </h3>
      </div>

      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            type="url"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="Paste Cloudinary / CDN Image URL..."
            className="flex-1 px-3 py-2 bg-background border border-border rounded text-text text-xs focus:outline-none focus:border-gold font-mono"
          />
          <button
            type="button"
            onClick={handleAdd}
            className="px-4 py-2 bg-gold/15 text-gold border border-gold/40 hover:bg-gold hover:text-obsidian rounded font-mono text-xs uppercase tracking-wider font-semibold transition-all cursor-pointer flex items-center gap-1"
          >
            <Plus size={14} /> Add Media
          </button>
        </div>

        {images.length === 0 ? (
          <div className="p-6 bg-background/50 border border-border/60 rounded-lg text-xs font-mono text-textMuted text-center">
            No gallery images uploaded yet.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {images.map((img, idx) => (
              <div
                key={idx}
                className="relative group aspect-square rounded-lg border border-border/80 overflow-hidden bg-background"
              >
                <img
                  src={img}
                  alt={`Gallery image ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => onRemoveImage(idx)}
                  className="absolute top-2 right-2 p-1.5 bg-rose-500/80 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  title="Remove image"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
