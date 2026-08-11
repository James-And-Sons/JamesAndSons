"use client";

import React from "react";
import Link from "next/link";
import { ShoppingBag, FileText, Bookmark, Ticket, MapPin } from "lucide-react";
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

const QUICK_LINKS = [
  {
    title: "Order History",
    desc: "Track shipments & download GST invoices",
    href: "/account/orders",
    icon: ShoppingBag,
  },
  {
    title: "Saved Addresses",
    desc: "Manage billing & shipping address book",
    href: "/account/addresses",
    icon: MapPin,
  },
  {
    title: "Custom RFQ Quotes",
    desc: "B2B trade quotes & custom pricing",
    href: "/account/rfqs",
    icon: FileText,
  },
  {
    title: "Support Tickets",
    desc: "Concierge help & order inquiries",
    href: "/account/tickets",
    icon: Ticket,
  },
];

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
    <div className="space-y-8">
      {/* Profile Header Card */}
      <AccountProfileCard user={user} dbUser={dbUser} isB2B={isB2B} />

      {/* Quick Access Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {QUICK_LINKS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="p-5 bg-surface border border-border hover:border-gold/50 rounded-2xl shadow-sm transition-all group hover:-translate-y-0.5"
          >
            <item.icon
              size={22}
              className="text-gold mb-3 group-hover:scale-110 transition-transform"
            />
            <h4 className="font-semibold text-text text-sm group-hover:text-gold transition-colors">
              {item.title}
            </h4>
            <p className="text-xs text-textMuted mt-1">{item.desc}</p>
          </Link>
        ))}
      </div>

      {/* Recent Purchases & Orders */}
      <RecentOrdersSection orders={orders} />

      {/* Biometric Passkey Security */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-md space-y-4">
        <PasskeyManagerCard />
      </div>

      {/* Wishlist Section */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-md space-y-4">
        <h3 className="text-lg font-serif font-bold text-text flex items-center gap-2 border-b border-border/40 pb-3">
          <Bookmark size={18} className="text-gold" />
          My Wishlist
        </h3>
        <AccountWishlistClient />
      </div>
    </div>
  );
}
