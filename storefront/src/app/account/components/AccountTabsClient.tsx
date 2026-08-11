"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  FileText,
  Bookmark,
  Ticket,
  KeyRound,
  MapPin,
  LayoutDashboard,
  Shield,
  ChevronRight,
} from "lucide-react";
import AccountProfileCard from "./AccountProfileCard";
import RecentOrdersSection from "./RecentOrdersSection";
import AccountWishlistClient from "../AccountWishlistClient";
import PasskeyManagerCard from "@/components/PasskeyManagerCard";
import AddressListClient from "../addresses/AddressListClient";

type Tab = "overview" | "orders" | "addresses" | "wishlist" | "security";

interface AccountTabsClientProps {
  user: any;
  dbUser: any;
  isB2B: boolean;
  orders: any[];
  addresses: any[];
  totalOrderCount: number;
}

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "orders", label: "Orders", icon: ShoppingBag },
  { id: "addresses", label: "Addresses", icon: MapPin },
  { id: "wishlist", label: "Wishlist", icon: Bookmark },
  { id: "security", label: "Security", icon: Shield },
];

const QUICK_LINKS = [
  {
    title: "Order History",
    desc: "Track shipments & download GST invoices",
    href: "/account/orders",
    icon: ShoppingBag,
    tab: "orders" as Tab,
  },
  {
    title: "Saved Addresses",
    desc: "Manage billing & shipping address book",
    href: "/account/addresses",
    icon: MapPin,
    tab: "addresses" as Tab,
  },
  {
    title: "Custom RFQ Quotes",
    desc: "B2B trade quotes & custom pricing",
    href: "/account/rfqs",
    icon: FileText,
    tab: null,
  },
  {
    title: "Support Tickets",
    desc: "Concierge help & order inquiries",
    href: "/account/tickets",
    icon: Ticket,
    tab: null,
  },
];

export default function AccountTabsClient({
  user,
  dbUser,
  isB2B,
  orders,
  addresses,
  totalOrderCount,
}: AccountTabsClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  return (
    <div className="space-y-6">
      {/* Profile Card — always visible */}
      <AccountProfileCard user={user} dbUser={dbUser} isB2B={isB2B} />

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {[
          {
            label: "Total Orders",
            value: totalOrderCount,
            action: () => setActiveTab("orders"),
          },
          {
            label: "Saved Addresses",
            value: addresses.length,
            action: () => setActiveTab("addresses"),
          },
          {
            label: "Member Since",
            value: dbUser?.createdAt
              ? new Date(dbUser.createdAt).getFullYear()
              : "—",
            action: null,
          },
        ].map((stat) => (
          <button
            key={stat.label}
            onClick={stat.action || undefined}
            className={`bg-surface border border-border rounded-xl p-4 text-center transition-all ${stat.action ? "hover:border-gold/40 hover:bg-surface2 cursor-pointer" : "cursor-default"}`}
          >
            <div className="text-xl sm:text-2xl font-serif font-bold text-gold">
              {stat.value}
            </div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-textMuted mt-1">
              {stat.label}
            </div>
          </button>
        ))}
      </div>

      {/* Tab Navigator */}
      <div className="overflow-x-auto scrollbar-none">
        <div className="flex gap-1 bg-surface border border-border rounded-xl p-1 min-w-max">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-gold text-obsidian font-bold shadow-md"
                    : "text-textMuted hover:text-text hover:bg-surface2"
                }`}
              >
                <Icon size={13} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {/* ─── Overview ─── */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Quick Access Tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {QUICK_LINKS.map((item) => {
                const handleClick = item.tab
                  ? () => setActiveTab(item.tab!)
                  : () => {
                      window.location.href = item.href;
                    };
                return (
                  <button
                    key={item.href}
                    onClick={handleClick}
                    className="group p-5 bg-surface border border-border hover:border-gold/50 rounded-2xl shadow-sm transition-all hover:-translate-y-0.5 text-left w-full cursor-pointer"
                  >
                    <item.icon
                      size={22}
                      className="text-gold mb-3 group-hover:scale-110 transition-transform"
                    />
                    <h4 className="font-semibold text-text text-sm group-hover:text-gold transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-xs text-textMuted mt-1">{item.desc}</p>
                  </button>
                );
              })}
            </div>

            {/* Recent Orders Preview */}
            <div className="bg-surface border border-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-lg font-bold text-text flex items-center gap-2">
                  <ShoppingBag size={16} className="text-gold" />
                  Recent Orders
                </h3>
                <button
                  onClick={() => setActiveTab("orders")}
                  className="text-xs font-mono text-gold hover:underline flex items-center gap-1"
                >
                  View All <ChevronRight size={12} />
                </button>
              </div>
              <RecentOrdersSection orders={orders.slice(0, 3)} />
            </div>
          </div>
        )}

        {/* ─── Orders ─── */}
        {activeTab === "orders" && (
          <div className="bg-surface border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-serif text-lg font-bold text-text flex items-center gap-2">
                <ShoppingBag size={16} className="text-gold" />
                Order History
              </h3>
              <Link
                href="/account/orders"
                className="text-xs font-mono text-gold hover:underline flex items-center gap-1"
              >
                Full History <ChevronRight size={12} />
              </Link>
            </div>
            <RecentOrdersSection orders={orders} />
          </div>
        )}

        {/* ─── Addresses ─── */}
        {activeTab === "addresses" && (
          <div className="bg-surface border border-border rounded-2xl p-5">
            <h3 className="font-serif text-lg font-bold text-text flex items-center gap-2 mb-5">
              <MapPin size={16} className="text-gold" />
              Saved Addresses
            </h3>
            <AddressListClient initialAddresses={addresses} />
          </div>
        )}

        {/* ─── Wishlist ─── */}
        {activeTab === "wishlist" && (
          <div className="bg-surface border border-border rounded-2xl p-5">
            <h3 className="font-serif text-lg font-bold text-text flex items-center gap-2 mb-5">
              <Bookmark size={16} className="text-gold" />
              My Wishlist
            </h3>
            <AccountWishlistClient />
          </div>
        )}

        {/* ─── Security ─── */}
        {activeTab === "security" && (
          <div className="space-y-4">
            <div className="bg-surface border border-border rounded-2xl p-5">
              <h3 className="font-serif text-lg font-bold text-text flex items-center gap-2 mb-1">
                <Shield size={16} className="text-gold" />
                Security & Authentication
              </h3>
              <p className="text-xs text-textMuted mb-5">
                Set up biometric passkeys for fast and secure passwordless
                sign-in.
              </p>
              <PasskeyManagerCard />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
