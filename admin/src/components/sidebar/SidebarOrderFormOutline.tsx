"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  User,
  Truck,
  Package,
  CreditCard,
  FileText,
  Radio,
  ArrowLeft,
  RefreshCw,
  Download,
} from "lucide-react";

interface SidebarOrderFormOutlineProps {
  orderDetailState: any;
  onClose?: () => void;
}

export default function SidebarOrderFormOutline({
  orderDetailState,
  onClose,
}: SidebarOrderFormOutlineProps) {
  if (!orderDetailState) return null;

  const [isDownloadingSidebar, setIsDownloadingSidebar] = useState(false);

  useEffect(() => {
    const handleStatus = (e: any) => {
      if (e.detail && typeof e.detail.downloading === "boolean") {
        setIsDownloadingSidebar(e.detail.downloading);
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("jns:download-status", handleStatus);
      return () => {
        window.removeEventListener("jns:download-status", handleStatus);
      };
    }
  }, []);

  const {
    orderNumber,
    status,
    totalAmount = 0,
    customerName,
    itemCount = 0,
  } = orderDetailState;

  const navSections = [
    { id: "customer-info", label: "Customer Details", icon: User },
    { id: "fulfillment-studio", label: "Fulfillment Studio", icon: Truck },
    { id: "order-items", label: `Order Items (${itemCount})`, icon: Package },
    { id: "payment-summary", label: "Financial Summary", icon: CreditCard },
    { id: "compliance-documents", label: "Documents Studio", icon: FileText },
    { id: "live-tracking", label: "Live Tracking", icon: Radio },
  ];

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (onClose) onClose();
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClose) onClose();
  };

  return (
    <div className="space-y-4">
      {/* Back Link */}
      <Link
        href="/orders"
        onClick={handleNavClick}
        className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted hover:text-accent transition-colors px-1"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>All Orders</span>
      </Link>

      {/* Order Header Summary Card */}
      <div className="bg-surface border border-border p-3.5 rounded-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[13px] font-bold text-primary">
            {orderNumber}
          </span>
          <span className="font-mono text-[9px] uppercase px-2 py-0.5 bg-amber-500/5 border border-amber-500/20 text-amber-400/90 font-bold rounded-xs">
            {status}
          </span>
        </div>
        {customerName && (
          <p className="font-serif text-[12px] text-muted truncate m-0">
            {customerName}
          </p>
        )}
        <div className="flex justify-between items-center pt-1.5 border-t border-border/60">
          <span className="font-mono text-[9px] text-muted uppercase">
            Total Value
          </span>
          <span className="font-mono text-[12px] font-bold text-accent">
            ₹{Number(totalAmount).toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {/* Section Jump Nav */}
      <div className="space-y-1">
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted px-2 py-1 m-0">
          Quick Jump Nav
        </p>
        {navSections.map((sec) => {
          const Icon = sec.icon;
          return (
            <button
              key={sec.id}
              onClick={() => scrollToSection(sec.id)}
              className="w-full text-left font-mono text-[11px] text-muted hover:text-accent hover:bg-accent/10 px-3 py-2 rounded-xs transition-colors flex items-center gap-2 cursor-pointer group"
            >
              <Icon className="w-3.5 h-3.5 text-muted group-hover:text-accent flex-shrink-0" />
              <span className="truncate">{sec.label}</span>
            </button>
          );
        })}
      </div>

      {/* Downloadable Documents List */}
      <div className="pt-2 border-t border-border space-y-1">
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted px-2 py-1 m-0">
          Download Documents
        </p>

        {/* Download All Button (triggers exact same PDF bundle download) */}
        <button
          type="button"
          disabled={isDownloadingSidebar}
          onClick={() => {
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("jns:download-all-docs"));
            }
          }}
          className="w-full text-left font-mono text-[9px] uppercase tracking-wider px-3 py-2 bg-accent text-black hover:bg-accent-hover font-bold rounded-xs transition-colors flex items-center justify-between mb-2 cursor-pointer shadow-sm disabled:opacity-60"
          title="Download all selected documents as a bundled package"
        >
          <span className="flex items-center gap-1.5">
            {isDownloadingSidebar ? (
              <RefreshCw className="w-3.5 h-3.5 text-black animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5 text-black" />
            )}
            <span>
              {isDownloadingSidebar
                ? "Preparing Package..."
                : "Download All Documents"}
            </span>
          </span>
        </button>
      </div>
    </div>
  );
}
