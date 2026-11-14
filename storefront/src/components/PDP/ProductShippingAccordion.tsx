"use client";

import React, { useState } from "react";
import { Truck, ShieldCheck, RefreshCw, ChevronDown } from "lucide-react";

interface AccordionItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: string;
}

export default function ProductShippingAccordion() {
  const [openId, setOpenId] = useState<string | null>("shipping");

  const items: AccordionItem[] = [
    {
      id: "shipping",
      title: "White-Glove Insured Freight & Delivery",
      icon: <Truck size={16} className="text-gold" />,
      content:
        "Every fixture is dispatched via white-glove insured freight logistics with custom wooden crate crating. Transit timelines range from 3-7 business days across Pan-India metro centers with real-time GPS tracking.",
    },
    {
      id: "warranty",
      title: "1-Year Comprehensive Artisan Warranty",
      icon: <ShieldCheck size={16} className="text-gold" />,
      content:
        "Includes a 1-year full coverage warranty against electrical defects, brass tarnishing, and crystal structural integrity. Complete replacement or complimentary on-site artisan restoration included.",
    },
    {
      id: "returns",
      title: "7-Day Transit Inspection & Replacement Guarantee",
      icon: <RefreshCw size={16} className="text-gold" />,
      content:
        "Inspect upon delivery with our white-glove driver. In the rare event of transit breakage or discrepancy, complimentary immediate replacement is dispatched with zero hassle.",
    },
  ];

  return (
    <div className="space-y-2 py-4 border-t border-border/50">
      {items.map((item) => {
        const isOpen = openId === item.id;
        return (
          <div
            key={item.id}
            className="border border-border/60 rounded-lg overflow-hidden bg-surface/30"
          >
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : item.id)}
              className="w-full p-3.5 flex items-center justify-between text-left text-xs font-mono font-semibold text-cream hover:bg-surface2/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                {item.icon}
                <span>{item.title}</span>
              </div>
              <ChevronDown
                size={14}
                className={`text-gold transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isOpen && (
              <div className="p-3.5 pt-0 text-xs text-textMuted leading-relaxed border-t border-border/40 bg-background/40">
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
