"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  FileText,
  Bookmark,
  Ticket,
  MapPin,
  Shield,
  Plus,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import AccountProfileCard from "./AccountProfileCard";
import RecentOrdersSection from "./RecentOrdersSection";
import AccountWishlistClient from "../AccountWishlistClient";
import PasskeyManagerCard from "@/components/PasskeyManagerCard";
import AddressListClient from "../addresses/AddressListClient";

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
  // Navigation active card filter (default: "all" to show all cards in vertical stack, or select specific category card)
  const [filterCategory, setFilterCategory] = useState<
    "all" | "orders" | "addresses" | "wishlist" | "support" | "security"
  >("all");

  return (
    <div className="space-y-8">
      {/* ─── 1. Header Profile Card ─── */}
      <AccountProfileCard
        user={user}
        dbUser={dbUser}
        isB2B={isB2B}
        totalOrderCount={totalOrderCount}
        addressCount={addresses.length}
        ticketCount={tickets.length}
      />

      {/* ─── 2. Clean Category Filter Pills (No Horizontal Scroll) ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-4">
        <h2 className="font-serif text-xl font-bold text-text">
          Account Overview
        </h2>
        <div className="flex flex-wrap gap-2">
          {[
            { id: "all", label: "View All Cards" },
            { id: "orders", label: `Orders (${totalOrderCount})` },
            { id: "addresses", label: `Addresses (${addresses.length})` },
            { id: "wishlist", label: "Wishlist" },
            { id: "support", label: `Support (${tickets.length})` },
            { id: "security", label: "Security" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                filterCategory === cat.id
                  ? "bg-gold text-obsidian font-bold shadow-sm"
                  : "bg-surface border border-border text-textMuted hover:text-text hover:border-gold/40"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── 3. Modular Information Cards Stack ─── */}
      <div className="space-y-8">
        {/* Card: Orders History */}
        {(filterCategory === "all" || filterCategory === "orders") && (
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <RecentOrdersSection orders={orders} />
          </div>
        )}

        {/* Card: Address Book */}
        {(filterCategory === "all" || filterCategory === "addresses") && (
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-4">
              <h3 className="text-lg font-serif font-bold text-text flex items-center gap-2">
                <MapPin size={18} className="text-gold" />
                Saved Address Book
              </h3>
            </div>
            <AddressListClient initialAddresses={addresses} />
          </div>
        )}

        {/* Card: Wishlist */}
        {(filterCategory === "all" || filterCategory === "wishlist") && (
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-4">
              <h3 className="text-lg font-serif font-bold text-text flex items-center gap-2">
                <Bookmark size={18} className="text-gold" />
                My Wishlist
              </h3>
            </div>
            <AccountWishlistClient />
          </div>
        )}

        {/* Card: Support & Trade RFQs */}
        {(filterCategory === "all" || filterCategory === "support") && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Support Tickets Card */}
            <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-serif text-lg font-bold text-text flex items-center gap-2">
                    <Ticket size={18} className="text-gold" />
                    Concierge Support
                  </h3>
                  <span className="text-xs font-mono text-gold bg-gold/10 px-2 py-0.5 rounded border border-gold/20">
                    {tickets.length} Active
                  </span>
                </div>
                <p className="text-xs text-textMuted leading-relaxed mb-4">
                  Need assistance with an order, return request, or custom
                  fitting? Our concierge team is available to assist you.
                </p>

                {tickets.length > 0 ? (
                  <div className="space-y-2 mb-4">
                    {tickets.slice(0, 3).map((t) => (
                      <Link
                        key={t.id}
                        href={`/account/tickets/${t.id}`}
                        className="block p-3 bg-background border border-border/50 rounded-xl hover:border-gold/50 transition-colors"
                      >
                        <div className="flex items-center justify-between text-xs font-mono font-semibold text-text">
                          <span>
                            #{t.ticketNumber} • {t.subject}
                          </span>
                          <span className="text-[10px] text-gold uppercase">
                            {t.status}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="flex gap-3">
                <Link
                  href="/account/tickets/new"
                  className="flex-1 py-2.5 bg-gold text-obsidian font-mono text-xs uppercase font-bold text-center rounded-lg hover:brightness-110 transition-all flex items-center justify-center gap-1.5"
                >
                  <Plus size={14} />
                  New Ticket
                </Link>
                <Link
                  href="/account/tickets"
                  className="px-4 py-2.5 border border-border text-textMuted hover:text-text font-mono text-xs uppercase rounded-lg transition-colors flex items-center gap-1"
                >
                  All Tickets <ExternalLink size={12} />
                </Link>
              </div>
            </div>

            {/* Custom Trade RFQs Card */}
            <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-serif text-lg font-bold text-text flex items-center gap-2">
                    <FileText size={18} className="text-gold" />
                    Custom Trade RFQs
                  </h3>
                  <span className="text-xs font-mono text-gold bg-gold/10 px-2 py-0.5 rounded border border-gold/20">
                    {rfqs.length} Active
                  </span>
                </div>
                <p className="text-xs text-textMuted leading-relaxed mb-4">
                  Request custom trade quotes, architect volume pricing, or
                  bespoke manufacturing estimates for interior design projects.
                </p>

                {rfqs.length > 0 ? (
                  <div className="space-y-2 mb-4">
                    {rfqs.slice(0, 3).map((r) => (
                      <div
                        key={r.id}
                        className="p-3 bg-background border border-border/50 rounded-xl text-xs font-mono text-text flex items-center justify-between"
                      >
                        <span>RFQ #{r.id.slice(0, 8)}</span>
                        <span className="text-[10px] text-gold uppercase">
                          {r.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="flex gap-3">
                <Link
                  href="/rfq"
                  className="flex-1 py-2.5 bg-surface2 border border-gold/40 text-gold font-mono text-xs uppercase font-bold text-center rounded-lg hover:bg-gold hover:text-obsidian transition-all flex items-center justify-center gap-1.5"
                >
                  <Plus size={14} />
                  Request Quote
                </Link>
                <Link
                  href="/account/rfqs"
                  className="px-4 py-2.5 border border-border text-textMuted hover:text-text font-mono text-xs uppercase rounded-lg transition-colors flex items-center gap-1"
                >
                  All Quotes <ExternalLink size={12} />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Card: Security & Passkeys */}
        {(filterCategory === "all" || filterCategory === "security") && (
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <div className="border-b border-border/40 pb-4">
              <h3 className="text-lg font-serif font-bold text-text flex items-center gap-2">
                <Shield size={18} className="text-gold" />
                Biometric Passkeys & Passwordless Security
              </h3>
              <p className="text-xs text-textMuted mt-1">
                Register Face ID, Touch ID, or hardware security keys for
                instant passwordless sign-in.
              </p>
            </div>
            <PasskeyManagerCard />
          </div>
        )}
      </div>
    </div>
  );
}
