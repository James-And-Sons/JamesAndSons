"use client";

import React from "react";
import { Globe, Share2, Mail, Bell, Sparkles } from "lucide-react";
import { PromotionFormSidebarState } from "@/lib/context/SidebarContext";

interface SidebarPromotionOutlineProps {
  promotionState: PromotionFormSidebarState;
  onClose?: () => void;
}

export default function SidebarPromotionOutline({
  promotionState,
  onClose,
}: SidebarPromotionOutlineProps) {
  if (!promotionState) return null;

  const {
    mode,
    code,
    description,
    type,
    value,
    status,
    isDirty,
    isBasicComplete,
    isRulesComplete,
    isScheduleComplete,
    isChannelsComplete,
    activeSection,
    setActiveSection,
    targetChannels,
    submitForm,
    saving,
  } = promotionState;

  const sections = [
    { id: "promo-basic", label: "Basic Details", done: isBasicComplete },
    { id: "promo-rules", label: "Discount Rules", done: isRulesComplete },
    {
      id: "promo-schedule",
      label: "Validity & Schedule",
      done: isScheduleComplete,
    },
    {
      id: "promo-channels",
      label: "Multi-Channel Sync",
      done: isChannelsComplete,
    },
  ];

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
    setActiveSection(id);
    if (onClose) onClose();
  };

  return (
    <div className="flex-1 flex flex-col justify-between min-h-[350px]">
      <div className="space-y-5">
        {/* Header */}
        <div className="pb-4 border-b border-border space-y-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (
                  isDirty &&
                  !confirm(
                    "You have unsaved changes. Are you sure you want to exit?",
                  )
                )
                  return;
                if (onClose) onClose();
              }}
              className="flex-1 text-center block px-3 py-2 text-[10px] font-mono tracking-[0.15em] uppercase text-muted hover:text-red-400 hover:border-red-500/40 hover:bg-red-950/20 transition-colors border border-border bg-background/50 rounded-sm"
            >
              ← Close Drawer
            </button>
            {submitForm && (
              <button
                type="button"
                onClick={submitForm}
                disabled={saving}
                className="flex-1 text-center block px-3 py-2 text-[10px] font-mono tracking-[0.15em] uppercase bg-accent text-accent-foreground font-semibold rounded-sm hover:brightness-110 transition-all disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Promo"}
              </button>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`w-2 h-2 rounded-full ${
                  isDirty ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
                }`}
              />
              <span className="font-mono text-[9px] uppercase tracking-widest text-muted">
                {mode === "add" ? "Creating Promotion" : "Editing Promotion"}
              </span>
            </div>
            <h2 className="font-mono text-base font-bold text-primary tracking-wider uppercase truncate">
              {code || "NEW_PROMO"}
            </h2>
            <p className="text-xs text-muted truncate">
              {description || "Configure offer details"}
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-mono uppercase border border-border px-2 py-0.5 rounded bg-background/60 text-accent font-semibold">
              {type === "PERCENTAGE"
                ? `${value}% OFF`
                : type === "FIXED_AMOUNT"
                  ? `₹${value} OFF`
                  : "FREE SHIPPING"}
            </span>
            <span
              className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded border ${
                status === "ACTIVE"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : "bg-zinc-500/10 text-zinc-400 border-zinc-500/30"
              }`}
            >
              {status}
            </span>
          </div>
        </div>

        {/* Section Outline */}
        <div className="space-y-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted font-semibold">
            Form Navigation
          </p>
          <div className="flex flex-col gap-1">
            {sections.map((sec) => {
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => scrollToSection(sec.id)}
                  className={`flex items-center justify-between text-left font-mono text-[11px] uppercase px-3 py-2.5 rounded-sm border transition-all cursor-pointer ${
                    isActive
                      ? "border-accent text-accent bg-accent/10 font-semibold"
                      : "border-border/40 text-muted hover:text-primary hover:border-accent/40 bg-background/30"
                  }`}
                >
                  <span className="truncate">{sec.label}</span>
                  {sec.done ? (
                    <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">
                      ✓
                    </span>
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-muted/40" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Multi-Channel Status Badge */}
        <div className="pt-2 border-t border-border space-y-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-accent" /> Active Integration
            Outlets
          </p>
          <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
            <div
              className={`p-2 rounded border flex items-center gap-1.5 ${
                targetChannels.googleMerchant
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                  : "bg-background/20 border-border/40 text-muted opacity-50"
              }`}
            >
              <Globe className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Google Merchant</span>
            </div>
            <div
              className={`p-2 rounded border flex items-center gap-1.5 ${
                targetChannels.metaCommerce
                  ? "bg-blue-500/10 border-blue-500/30 text-blue-300"
                  : "bg-background/20 border-border/40 text-muted opacity-50"
              }`}
            >
              <Share2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Meta Commerce</span>
            </div>
            <div
              className={`p-2 rounded border flex items-center gap-1.5 ${
                targetChannels.emailBlast
                  ? "bg-purple-500/10 border-purple-500/30 text-purple-300"
                  : "bg-background/20 border-border/40 text-muted opacity-50"
              }`}
            >
              <Mail className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Email Blast</span>
            </div>
            <div
              className={`p-2 rounded border flex items-center gap-1.5 ${
                targetChannels.webPush
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  : "bg-background/20 border-border/40 text-muted opacity-50"
              }`}
            >
              <Bell className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Web Push</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
