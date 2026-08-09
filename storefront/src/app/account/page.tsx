import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import AccountProfileCard from "./components/AccountProfileCard";
import RecentOrdersSection from "./components/RecentOrdersSection";
import AccountWishlistClient from "./AccountWishlistClient";
import PasskeyManagerCard from "@/components/PasskeyManagerCard";
import {
  ShoppingBag,
  FileText,
  Bookmark,
  Ticket,
  KeyRound,
  MapPin,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/account");
  }

  let dbUser: any = null;
  try {
    dbUser =
      (await prisma.user.findUnique({
        where: { id: user.id },
        include: { company: true },
      })) ||
      (user.email
        ? await prisma.user.findUnique({
            where: { email: user.email },
            include: { company: true },
          })
        : null);
  } catch (error) {
    console.error("Error fetching dbUser in AccountPage:", error);
  }

  let orders: any[] = [];
  try {
    if (dbUser) {
      orders = await prisma.order.findMany({
        where: { userId: dbUser.id },
        orderBy: { createdAt: "desc" },
        take: 3,
        include: { items: { include: { product: true } } },
      });
    }
  } catch (error) {
    console.error("Error fetching orders in AccountPage:", error);
  }

  const meta = user.user_metadata || {};
  const isB2B =
    dbUser?.role === "B2B_BUYER" ||
    dbUser?.role === "B2B_APPROVER" ||
    meta.account_type === "business";

  const quickLinks = [
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

  return (
    <div className="min-h-screen py-12 px-4 bg-background max-w-6xl mx-auto space-y-8">
      {/* Profile Header */}
      <AccountProfileCard user={user} dbUser={dbUser} isB2B={isB2B} />

      {/* Quick Access Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickLinks.map((item) => (
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

      {/* Recent Orders List */}
      <RecentOrdersSection orders={orders} />

      {/* Passkey Security Manager */}
      <PasskeyManagerCard />

      {/* Wishlist Component */}
      <AccountWishlistClient />
    </div>
  );
}
