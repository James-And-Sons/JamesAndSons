import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import AccountTabsClient from "./components/AccountTabsClient";

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
  let totalOrderCount = 0;
  try {
    if (dbUser) {
      [orders, totalOrderCount] = await Promise.all([
        prisma.order.findMany({
          where: { userId: dbUser.id },
          orderBy: { createdAt: "desc" },
          take: 10,
          include: { items: { include: { product: true } } },
        }),
        prisma.order.count({ where: { userId: dbUser.id } }),
      ]);
    }
  } catch (error) {
    console.error("Error fetching orders in AccountPage:", error);
  }

  let addresses: any[] = [];
  try {
    if (dbUser) {
      addresses = await prisma.userAddress.findMany({
        where: { userId: dbUser.id },
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
      });
    }
  } catch (error) {
    console.error("Error fetching addresses in AccountPage:", error);
  }

  let rfqs: any[] = [];
  try {
    if (dbUser) {
      rfqs = await prisma.rFQ.findMany({
        where: { userId: dbUser.id },
        orderBy: { createdAt: "desc" },
        take: 5,
      });
    }
  } catch (error) {
    console.error("Error fetching rfqs in AccountPage:", error);
  }

  let tickets: any[] = [];
  try {
    if (dbUser) {
      tickets = await prisma.ticket.findMany({
        where: { userId: dbUser.id },
        orderBy: { createdAt: "desc" },
        take: 5,
      });
    }
  } catch (error) {
    console.error("Error fetching tickets in AccountPage:", error);
  }

  const meta = user.user_metadata || {};
  const isB2B =
    dbUser?.role === "B2B_BUYER" ||
    dbUser?.role === "B2B_APPROVER" ||
    meta.account_type === "business";

  // Serialize dates for client components
  const serializedOrders = orders.map((o) => ({
    ...o,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
    items: o.items.map((i: any) => ({
      ...i,
      createdAt: i.createdAt.toISOString(),
      updatedAt: i.updatedAt.toISOString(),
      product: i.product
        ? {
            ...i.product,
            createdAt: i.product.createdAt.toISOString(),
            updatedAt: i.product.updatedAt.toISOString(),
          }
        : null,
    })),
  }));

  const serializedAddresses = addresses.map((a) => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }));

  const serializedRfqs = rfqs.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  const serializedTickets = tickets.map((t) => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }));

  const serializedDbUser = dbUser
    ? {
        ...dbUser,
        createdAt: dbUser.createdAt.toISOString(),
        updatedAt: dbUser.updatedAt.toISOString(),
        company: dbUser.company
          ? {
              ...dbUser.company,
              createdAt: dbUser.company.createdAt.toISOString(),
              updatedAt: dbUser.company.updatedAt.toISOString(),
            }
          : null,
      }
    : null;

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 bg-background max-w-5xl mx-auto">
      <AccountTabsClient
        user={user}
        dbUser={serializedDbUser}
        isB2B={isB2B}
        orders={serializedOrders}
        addresses={serializedAddresses}
        rfqs={serializedRfqs}
        tickets={serializedTickets}
        totalOrderCount={totalOrderCount}
      />
    </div>
  );
}
