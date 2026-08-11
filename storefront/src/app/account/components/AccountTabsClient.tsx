"use client";

import React from "react";
import Link from "next/link";
import {
  Package,
  FileText,
  Heart,
  MapPin,
  Ticket,
  ChevronRight,
} from "lucide-react";
import AccountProfileCard from "./AccountProfileCard";
import RecentOrdersSection from "./RecentOrdersSection";
import AccountWishlistClient from "../AccountWishlistClient";
import PasskeyManagerCard from "@/components/PasskeyManagerCard";

interface AccountTabsClientProps {
  user: any;
  dbUser: any;
  isB2B: boolean;
  orders: any[];
  addresses: any[];
  rfqs: any[];
  tickets: any[];
  totalOrderCount: number;
}

export default function AccountTabsClient({
  user,
  dbUser,
  isB2B,
  orders,
  addresses,
  rfqs,
  tickets,
  totalOrderCount,
}: AccountTabsClientProps) {
  const accountLinks = [
    {
      label: "My Orders",
      desc: "Manage your purchases, shipments & GST invoices",
      href: "/account/orders",
      icon: Package,
    },
    {
      label: "Address Book",
      desc: "Manage billing & shipping address book",
      href: "/account/addresses",
      icon: MapPin,
    },
    {
      label: "Saved Wishlist",
      desc: "View your saved luxury pieces",
      href: "/account/wishlist",
      icon: Heart,
    },
    {
      label: "Support Tickets",
      desc: "Concierge help, return requests & order inquiries",
      href: "/account/tickets",
      icon: Ticket,
    },
    {
      label: "Trade RFQs",
      desc: "Custom quotes & architect volume pricing",
      href: "/account/rfqs",
      icon: FileText,
    },
  ];

  return (
    <div className="space-y-8 lg:space-y-10 w-full">
      {/* ── 1. Profile Hero Card Banner ── */}
      <AccountProfileCard user={user} dbUser={dbUser} isB2B={isB2B} />

      {/* ── 2. Grid of Navigation Tiles with Explicit Gaps ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-5">
        {accountLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="p-5 bg-[var(--surface)] border border-[var(--border)] rounded-[20px] hover:border-[var(--gold)]/50 hover:bg-[var(--surface2)] transition-all duration-300 group flex flex-col justify-between shadow-sm hover:-translate-y-1 text-decoration-none"
            >
              <div>
                <div className="w-11 h-11 rounded-[14px] bg-[rgba(196,160,90,0.13)] border border-[var(--border)] flex items-center justify-center text-[var(--gold)] mb-3 group-hover:border-[var(--gold)]/40 transition-colors">
                  <Icon size={20} />
                </div>
                <div className="text-base font-serif font-medium text-[var(--cream)] group-hover:text-[var(--gold)] transition-colors">
                  {link.label}
                </div>
                <div className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                  {link.desc}
                </div>
              </div>
              <div className="flex items-center justify-end mt-4 pt-3 border-t border-[var(--border)]/40 text-xs font-mono text-[var(--gold)] group-hover:translate-x-1 transition-all">
                <ChevronRight size={18} />
              </div>
            </Link>
          );
        })}
      </div>

      {/* ── 3. Main Desktop Grid for Recent Purchases, Security, and Wishlist ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        {/* Left Column: Recent Purchases (7 cols) */}
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[24px] p-6 sm:p-8 shadow-sm">
            <RecentOrdersSection orders={orders} />
          </div>
        </div>

        {/* Right Column: Security Passkeys & Wishlist (5 cols) */}
        <div className="lg:col-span-5 space-y-8">
          {/* Security & Authentication */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[24px] p-6 sm:p-8 shadow-sm">
            <h3 className="text-xl font-serif font-medium text-[var(--cream)] mb-4 pb-3 border-b border-[var(--border)]">
              Security & Passkeys
            </h3>
            <PasskeyManagerCard />
          </div>

          {/* Saved Wishlist */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[24px] p-6 sm:p-8 shadow-sm">
            <h3 className="text-xl font-serif font-medium text-[var(--cream)] mb-4 pb-3 border-b border-[var(--border)]">
              Saved Items
            </h3>
            <AccountWishlistClient />
          </div>
        </div>
      </div>
    </div>
  );
}
