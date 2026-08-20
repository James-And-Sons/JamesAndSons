"use client";

import React from "react";
import { Star, ShieldCheck, ThumbsUp } from "lucide-react";

export interface ReviewItem {
  id: string;
  author: string;
  rating: number;
  date: string;
  comment: string;
  verifiedPurchase?: boolean;
}

interface ProductReviewsSectionProps {
  rating: number;
  reviewCount: number;
  reviews?: ReviewItem[];
}

export default function ProductReviewsSection({
  rating = 5.0,
  reviewCount = 0,
  reviews = [],
}: ProductReviewsSectionProps) {
  return (
    <div className="space-y-6 py-6 border-t border-border/50">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-serif font-bold text-lg text-cream">
            Client Experiences & Ratings
          </h3>
          <p className="text-xs font-mono text-textMuted mt-0.5">
            Verified Patrons & Architectural Reviews
          </p>
        </div>

        <div className="flex items-center gap-3 bg-surface/60 border border-border/60 px-4 py-2 rounded-lg">
          <div className="flex items-center gap-1 text-gold">
            <Star size={16} className="fill-gold" />
            <span className="font-mono font-bold text-sm">
              {rating.toFixed(1)}
            </span>
          </div>
          <span className="text-xs text-textMuted font-mono">
            ({reviewCount} Reviews)
          </span>
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="p-6 bg-surface/30 border border-border/40 rounded-xl text-center space-y-2">
          <div className="text-xs font-mono text-textMuted">
            Be the first patron to share your experience with this bespoke
            masterwork.
          </div>
          <button
            type="button"
            className="px-4 py-2 bg-gold/15 text-gold border border-gold/40 hover:bg-gold hover:text-obsidian rounded font-mono text-[11px] uppercase tracking-wider font-semibold transition-all cursor-pointer"
          >
            Write a Patron Review
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="p-4 bg-surface/40 border border-border/60 rounded-xl space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="font-serif font-bold text-sm text-cream">
                  {rev.author}
                </div>
                <div className="flex items-center gap-0.5 text-gold">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={12}
                      className={i < rev.rating ? "fill-gold" : "text-border"}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 text-[10px] font-mono text-textMuted">
                <span>{rev.date}</span>
                {rev.verifiedPurchase && (
                  <span className="text-emerald-400 flex items-center gap-0.5">
                    <ShieldCheck size={11} /> Verified Patron
                  </span>
                )}
              </div>

              <p className="text-xs text-textMuted leading-relaxed pt-1">
                {rev.comment}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
