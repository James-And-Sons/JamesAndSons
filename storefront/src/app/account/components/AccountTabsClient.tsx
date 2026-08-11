"use client";

import React from "react";
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
  return (
    <div className="space-y-10 sm:space-y-12 lg:space-y-14">
      {/* ─── 1. Header Profile Card Banner ─── */}
      <AccountProfileCard
        user={user}
        dbUser={dbUser}
        isB2B={isB2B}
        totalOrderCount={totalOrderCount}
        addressCount={addresses.length}
        ticketCount={tickets.length}
      />

      {/* ─── 2. Responsive 2-Column Widescreen Desktop Grid (No Selector Pills) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
        {/* ─── Left Sidebar Cards Column (4 cols on desktop) ─── */}
        <div className="lg:col-span-4 space-y-10 lg:space-y-12">
          {/* Card: Concierge Support Tickets */}
          <div className="bg-surface/90 border border-border/50 rounded-3xl p-8 sm:p-10 shadow-lg shadow-black/5 space-y-6 flex flex-col justify-between hover:border-gold/30 transition-all duration-300">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border/40 pb-4">
                <h3 className="font-serif text-xl font-medium text-text flex items-center gap-2.5">
                  <Ticket size={20} className="text-gold" />
                  Concierge Support
                </h3>
                <span className="text-xs font-mono text-gold bg-gold/10 px-3 py-1 rounded-full border border-gold/20 font-semibold">
                  {tickets.length} Active
                </span>
              </div>
              <p className="text-xs text-textMuted leading-relaxed">
                Need assistance with an order, return request, or custom
                fitting? Our concierge team is available to assist you.
              </p>

              {tickets.length > 0 ? (
                <div className="space-y-2.5 pt-2">
                  {tickets.slice(0, 3).map((t) => (
                    <Link
                      key={t.id}
                      href={`/account/tickets/${t.id}`}
                      className="block p-4 bg-background/70 border border-border/50 rounded-2xl hover:border-gold/40 transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs font-mono font-semibold text-text">
                        <span className="truncate max-w-[180px]">
                          #{t.ticketNumber} • {t.subject}
                        </span>
                        <span className="text-[10px] text-gold uppercase tracking-wider">
                          {t.status}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="flex gap-3 pt-4 border-t border-border/40">
              <Link
                href="/account/tickets/new"
                className="flex-1 py-3 bg-gold text-obsidian font-mono text-xs uppercase font-bold text-center rounded-xl hover:brightness-110 transition-all shadow-md shadow-gold/10 flex items-center justify-center gap-1.5"
              >
                <Plus size={14} />
                New Ticket
              </Link>
              <Link
                href="/account/tickets"
                className="px-4 py-3 border border-border text-textMuted hover:text-text font-mono text-xs uppercase rounded-xl transition-colors flex items-center gap-1"
              >
                All <ExternalLink size={12} />
              </Link>
            </div>
          </div>

          {/* Card: Custom Trade RFQs */}
          <div className="bg-surface/90 border border-border/50 rounded-3xl p-8 sm:p-10 shadow-lg shadow-black/5 space-y-6 flex flex-col justify-between hover:border-gold/30 transition-all duration-300">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border/40 pb-4">
                <h3 className="font-serif text-xl font-medium text-text flex items-center gap-2.5">
                  <FileText size={20} className="text-gold" />
                  Trade RFQ Quotes
                </h3>
                <span className="text-xs font-mono text-gold bg-gold/10 px-3 py-1 rounded-full border border-gold/20 font-semibold">
                  {rfqs.length} Active
                </span>
              </div>
              <p className="text-xs text-textMuted leading-relaxed">
                Request custom trade quotes, architect volume pricing, or
                bespoke manufacturing estimates for design projects.
              </p>

              {rfqs.length > 0 ? (
                <div className="space-y-2.5 pt-2">
                  {rfqs.slice(0, 3).map((r) => (
                    <div
                      key={r.id}
                      className="p-4 bg-background/70 border border-border/50 rounded-2xl text-xs font-mono text-text flex items-center justify-between"
                    >
                      <span>RFQ #{r.id.slice(0, 8)}</span>
                      <span className="text-[10px] text-gold uppercase tracking-wider">
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="flex gap-3 pt-4 border-t border-border/40">
              <Link
                href="/rfq"
                className="flex-1 py-3 bg-surface2 border border-gold/40 text-gold font-mono text-xs uppercase font-bold text-center rounded-xl hover:bg-gold hover:text-obsidian transition-all flex items-center justify-center gap-1.5"
              >
                <Plus size={14} />
                Request Quote
              </Link>
              <Link
                href="/account/rfqs"
                className="px-4 py-3 border border-border text-textMuted hover:text-text font-mono text-xs uppercase rounded-xl transition-colors flex items-center gap-1"
              >
                All <ExternalLink size={12} />
              </Link>
            </div>
          </div>

          {/* Card: Biometric Passkey Security */}
          <div className="bg-surface/90 border border-border/50 rounded-3xl p-8 sm:p-10 shadow-lg shadow-black/5 space-y-6 hover:border-gold/30 transition-all duration-300">
            <div className="border-b border-border/40 pb-4">
              <h3 className="text-xl font-serif font-medium text-text flex items-center gap-2.5">
                <Shield size={20} className="text-gold" />
                Security & Passkeys
              </h3>
              <p className="text-xs text-textMuted mt-1.5 leading-relaxed">
                Register Touch ID, Face ID, or hardware security keys for
                instant passwordless sign-in.
              </p>
            </div>
            <PasskeyManagerCard />
          </div>
        </div>

        {/* ─── Right Main Cards Column (8 cols on desktop) ─── */}
        <div className="lg:col-span-8 space-y-10 lg:space-y-12">
          {/* Card: Order History & Recent Purchases */}
          <div className="bg-surface/90 border border-border/50 rounded-3xl p-8 sm:p-10 md:p-12 shadow-lg shadow-black/5 hover:border-gold/30 transition-all duration-300">
            <RecentOrdersSection orders={orders} />
          </div>

          {/* Card: Saved Address Book */}
          <div className="bg-surface/90 border border-border/50 rounded-3xl p-8 sm:p-10 md:p-12 shadow-lg shadow-black/5 space-y-6 hover:border-gold/30 transition-all duration-300">
            <div className="flex items-center justify-between border-b border-border/40 pb-4">
              <h3 className="text-xl font-serif font-medium text-text flex items-center gap-2.5">
                <MapPin size={22} className="text-gold" />
                Saved Address Book
              </h3>
            </div>
            <AddressListClient initialAddresses={addresses} />
          </div>

          {/* Card: Saved Wishlist Items */}
          <div className="bg-surface/90 border border-border/50 rounded-3xl p-8 sm:p-10 md:p-12 shadow-lg shadow-black/5 space-y-6 hover:border-gold/30 transition-all duration-300">
            <div className="flex items-center justify-between border-b border-border/40 pb-4">
              <h3 className="text-xl font-serif font-medium text-text flex items-center gap-2.5">
                <Bookmark size={22} className="text-gold" />
                My Wishlist
              </h3>
            </div>
            <AccountWishlistClient />
          </div>
        </div>
      </div>
    </div>
  );
}
