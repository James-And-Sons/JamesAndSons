"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";

export interface SearchResultItem {
  id: string;
  type: "product" | "page" | "account" | "blog" | "order";
  title: string;
  subtitle: string;
  url: string;
  price?: number;
  imageUrl?: string;
  badge?: string;
}

interface SearchResultRowProps {
  item: SearchResultItem;
  onSelect: () => void;
}

export default function SearchResultRow({
  item,
  onSelect,
}: SearchResultRowProps) {
  return (
    <Link
      href={item.url}
      onClick={onSelect}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface2 transition-colors border border-transparent hover:border-border/60"
    >
      {item.imageUrl && (
        <div className="w-12 h-12 relative bg-surface rounded overflow-hidden flex-shrink-0 border border-border">
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            sizes="48px"
            className="object-cover"
          />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-text text-sm truncate">
            {item.title}
          </span>
          {item.badge && (
            <span className="px-1.5 py-0.5 text-[10px] uppercase font-mono font-bold bg-gold/15 text-gold rounded border border-gold/30">
              {item.badge}
            </span>
          )}
        </div>
        <div className="text-xs text-textMuted truncate">{item.subtitle}</div>
      </div>

      {item.price !== undefined && (
        <div className="text-sm font-bold text-gold font-mono">
          {formatPrice(item.price)}
        </div>
      )}
    </Link>
  );
}
