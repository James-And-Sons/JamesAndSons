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
      {/* ── 1. Profile Hero Card Banner (Spans Full Desktop Width) ── */}
      <AccountProfileCard user={user} dbUser={dbUser} isB2B={isB2B} />

      {/* ── 2. Responsive Full-Viewport Desktop Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        {/* Left Column: Single Navigation Card + Passkey Security */}
        <div className="lg:col-span-5 space-y-8 lg:space-y-10">
          {/* Single Navigation Menu Card with Spaced Inner Tiles */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[24px] p-3 sm:p-4 shadow-sm flex flex-col gap-2.5">
            {accountLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-4 p-3.5 sm:p-4 rounded-[16px] bg-[var(--background)]/60 border border-[var(--border)]/50 hover:border-[var(--gold)]/40 hover:bg-[var(--surface2)] transition-all group text-decoration-none shadow-xs"
                >
                  <div className="w-10 h-10 rounded-[12px] bg-[rgba(196,160,90,0.13)] border border-[var(--border)] flex items-center justify-center text-[var(--gold)] shrink-0 group-hover:border-[var(--gold)]/40 transition-colors">
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[var(--cream)] group-hover:text-[var(--gold)] transition-colors">
                      {link.label}
                    </div>
                    <div className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                      {link.desc}
                    </div>
                  </div>
                  <ChevronRight
                    size={18}
                    className="text-[var(--text-muted)] group-hover:text-[var(--gold)] group-hover:translate-x-0.5 transition-all"
                  />
                </Link>
              );
            })}
          </div>

          {/* Security & Authentication Card */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[24px] p-6 sm:p-8 shadow-sm">
            <h3 className="text-xl font-serif font-medium text-[var(--cream)] mb-4 pb-3 border-b border-[var(--border)]">
              Security & Passkeys
            </h3>
            <PasskeyManagerCard />
          </div>
        </div>

        {/* Right Column: Recent Purchases + Saved Wishlist */}
        <div className="lg:col-span-7 space-y-8 lg:space-y-10">
          {/* Recent Purchases Card */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[24px] p-6 sm:p-8 shadow-sm">
            <RecentOrdersSection orders={orders} />
          </div>

          {/* Saved Items Card */}
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
