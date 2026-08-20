import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { User, Mail, Building2, ShoppingBag } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      company: true,
      orders: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      rfqs: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      tickets: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!user) {
    notFound();
  }

  const totalSpent = user.orders.reduce(
    (sum, o) => sum + (o.totalAmount || 0),
    0,
  );

  return (
    <div className="space-y-8">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-6 border border-border rounded-sm">
        <div>
          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-accent mb-1">
            <Link href="/customers" className="hover:underline">
              Customer Directory
            </Link>
            <span>/</span>
            <span>Customer Profile</span>
          </div>
          <h1 className="font-serif text-[28px] font-light text-primary m-0">
            {user.firstName} {user.lastName}
          </h1>
          <p className="font-mono text-[11px] text-muted m-0 mt-1">
            User ID: {user.id}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={`mailto:${user.email}`}
            className="btn-primary font-mono text-[10px] uppercase tracking-widest px-6 py-2.5 flex items-center gap-2 rounded-sm"
          >
            <Mail size={14} /> Send Email
          </a>
        </div>
      </div>

      {/* Grid Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Customer Profile Card */}
        <div className="premium-card p-6 space-y-4">
          <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted border-b border-border/50 pb-3 flex items-center gap-2 m-0">
            <User size={14} className="text-accent" /> Profile Details
          </h3>

          <div className="space-y-3 font-mono text-[11px]">
            <div>
              <span className="text-muted block text-[9px] uppercase">
                Full Name
              </span>
              <span className="text-primary text-[14px] font-serif">
                {user.firstName} {user.lastName}
              </span>
            </div>

            <div>
              <span className="text-muted block text-[9px] uppercase">
                Email
              </span>
              <a
                href={`mailto:${user.email}`}
                className="text-accent hover:underline"
              >
                {user.email}
              </a>
            </div>

            <div>
              <span className="text-muted block text-[9px] uppercase">
                Phone
              </span>
              <span className="text-primary">
                {user.phone || "Not provided"}
              </span>
            </div>

            <div>
              <span className="text-muted block text-[9px] uppercase">
                Role
              </span>
              <span
                className={`inline-block mt-0.5 font-mono text-[9px] uppercase tracking-[0.15em] px-2 py-0.5 rounded-sm border ${
                  user.role === "ADMIN"
                    ? "text-red-400 border-red-400/20 bg-red-400/5"
                    : user.role.startsWith("B2B")
                      ? "text-accent border-accent/20 bg-accent/5"
                      : "text-muted border-border bg-background"
                }`}
              >
                {user.role}
              </span>
            </div>

            <div>
              <span className="text-muted block text-[9px] uppercase">
                Joined On
              </span>
              <span className="text-secondary">
                {new Date(user.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Company & Trade Info */}
        <div className="premium-card p-6 space-y-4">
          <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted border-b border-border/50 pb-3 flex items-center gap-2 m-0">
            <Building2 size={14} className="text-accent" /> Business &amp; Trade
            Details
          </h3>

          {user.company ? (
            <div className="space-y-3 font-mono text-[11px]">
              <div>
                <span className="text-muted block text-[9px] uppercase">
                  Company Name
                </span>
                <span className="text-primary text-[15px] font-serif">
                  {user.company.name}
                </span>
              </div>

              <div>
                <span className="text-muted block text-[9px] uppercase">
                  GSTIN / Tax ID
                </span>
                <span className="text-accent font-semibold">
                  {user.company.gstin || "N/A"}
                </span>
              </div>

              <div>
                <span className="text-muted block text-[9px] uppercase">
                  Billing Address
                </span>
                <span className="text-secondary">
                  {user.company.billingAddress || "N/A"}
                </span>
              </div>

              <div>
                <span className="text-muted block text-[9px] uppercase">
                  Shipping Address
                </span>
                <span className="text-secondary">
                  {user.company.shippingAddress || "N/A"}
                </span>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center font-mono text-[10px] text-muted uppercase tracking-widest">
              Direct Consumer Account
            </div>
          )}
        </div>

        {/* Financial Summary */}
        <div className="premium-card p-6 space-y-4">
          <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted border-b border-border/50 pb-3 flex items-center gap-2 m-0">
            <ShoppingBag size={14} className="text-accent" /> Account Activity
          </h3>

          <div className="space-y-4">
            <div>
              <span className="font-mono text-[9px] uppercase tracking-widest text-muted block mb-1">
                Total Lifetime Spend
              </span>
              <div className="font-serif text-[28px] text-accent font-light">
                ₹{totalSpent.toLocaleString("en-IN")}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/40 font-mono text-[11px]">
              <div className="bg-background p-3 border border-border rounded-sm">
                <span className="text-muted block text-[9px] uppercase">
                  Total Orders
                </span>
                <span className="text-primary text-[16px] font-semibold">
                  {user.orders.length}
                </span>
              </div>
              <div className="bg-background p-3 border border-border rounded-sm">
                <span className="text-muted block text-[9px] uppercase">
                  RFQs Submitted
                </span>
                <span className="text-primary text-[16px] font-semibold">
                  {user.rfqs.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="premium-card overflow-hidden">
        <div className="p-6 border-b border-border flex justify-between items-center bg-surface-muted/30">
          <h3 className="font-serif text-[20px] text-primary font-normal m-0 flex items-center gap-2">
            <ShoppingBag size={18} className="text-accent" /> Recent Orders (
            {user.orders.length})
          </h3>
          <Link
            href="/orders"
            className="font-mono text-[9px] uppercase tracking-widest text-accent hover:underline"
          >
            View All Orders →
          </Link>
        </div>

        <table className="w-full text-left">
          <thead className="border-b border-border bg-background/50">
            <tr>
              <th className="px-6 py-3.5 font-mono text-[9px] uppercase tracking-widest text-muted">
                Order ID
              </th>
              <th className="px-6 py-3.5 font-mono text-[9px] uppercase tracking-widest text-muted">
                Date
              </th>
              <th className="px-6 py-3.5 font-mono text-[9px] uppercase tracking-widest text-muted">
                Total
              </th>
              <th className="px-6 py-3.5 font-mono text-[9px] uppercase tracking-widest text-muted">
                Status
              </th>
              <th className="px-6 py-3.5 font-mono text-[9px] uppercase tracking-widest text-muted text-right">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {user.orders.map((o) => (
              <tr
                key={o.id}
                className="hover:bg-surface-muted/40 transition-colors"
              >
                <td className="px-6 py-4 font-mono text-[12px] text-accent font-semibold">
                  <Link href={`/orders/${o.id}`} className="hover:underline">
                    {o.orderNumber || o.id}
                  </Link>
                </td>
                <td className="px-6 py-4 font-mono text-[11px] text-muted">
                  {new Date(o.createdAt).toLocaleDateString("en-IN")}
                </td>
                <td className="px-6 py-4 font-mono text-[13px] text-primary font-semibold">
                  ₹{(o.totalAmount || 0).toLocaleString("en-IN")}
                </td>
                <td className="px-6 py-4">
                  <span className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded border border-accent/30 text-accent bg-accent/5">
                    {o.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <Link
                    href={`/orders/${o.id}`}
                    className="font-mono text-[9px] uppercase tracking-widest text-accent hover:underline"
                  >
                    Details →
                  </Link>
                </td>
              </tr>
            ))}
            {user.orders.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-8 text-center font-mono text-[10px] text-muted uppercase tracking-widest"
                >
                  No orders placed yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
