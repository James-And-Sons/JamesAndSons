import { prisma } from "../lib/prisma";
import Link from "next/link";
import ClickableRow from "@/components/ClickableRow";

export const dynamic = "force-dynamic";

function getInitials(firstName?: string, lastName?: string): string {
  const f = firstName?.[0] || "";
  const l = lastName?.[0] || "";
  return (f + l).toUpperCase() || "CU";
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor(
    (new Date().getTime() - new Date(date).getTime()) / 1000,
  );
  if (seconds < 3600) return `${Math.max(1, Math.floor(seconds / 60))}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default async function Dashboard() {
  const results = await Promise.allSettled([
    prisma.order.findMany({
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.rFQ.findMany({
      include: { user: true, items: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.user.count({ where: { role: "B2B_BUYER" } }),
    prisma.user.count({ where: { role: "B2B_APPROVER" } }),
    prisma.ticket.findMany({
      where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.inquiry.findMany({
      where: { status: "NEW" },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.ticket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.inquiry.count({ where: { status: "NEW" } }),
    prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: {
        status: {
          notIn: ["PENDING", "CANCELLED"],
        },
      },
    }),
    prisma.order.count({
      where: {
        status: {
          notIn: ["PENDING", "CANCELLED"],
        },
      },
    }),
  ]);

  const orders =
    results[0].status === "fulfilled" ? (results[0].value as any) : [];
  const rfqs =
    results[1].status === "fulfilled" ? (results[1].value as any) : [];
  const b2bRegistrations =
    results[2].status === "fulfilled" ? (results[2].value as number) : 0;
  const pendingB2B =
    results[3].status === "fulfilled" ? (results[3].value as number) : 0;
  const tickets =
    results[4].status === "fulfilled" ? (results[4].value as any) : [];
  const inquiries =
    results[5].status === "fulfilled" ? (results[5].value as any) : [];
  const openTicketsCount =
    results[6].status === "fulfilled" ? (results[6].value as number) : 0;
  const newInquiriesCount =
    results[7].status === "fulfilled" ? (results[7].value as number) : 0;
  const revenueAggregate =
    results[8].status === "fulfilled"
      ? (results[8].value as any)
      : { _sum: { totalAmount: 0 } };
  const activeOrdersCount =
    results[9].status === "fulfilled" ? (results[9].value as number) : 0;

  const totalRevenue = revenueAggregate._sum.totalAmount || 0;
  const activeOrders = activeOrdersCount;
  const pendingRfqs = rfqs.filter(
    (r: any) => r.status === "SUBMITTED" || r.status === "DRAFT",
  ).length;

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-[32px] md:text-[36px] font-normal text-primary tracking-wide mb-1">
            Platform overview
          </h1>
          <p className="font-body text-muted text-[13px] m-0">
            Metrics and action items for James &amp; Sons operations.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid - Clickable & Reflows on Mobile */}
      <div
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
        role="list"
        aria-label="Key metrics"
      >
        {totalRevenue >= 1 && (
          <Link
            href="/orders"
            role="listitem"
            className="premium-card p-5 block no-underline group hover:border-accent/40 transition-all rounded-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted">
                TOTAL REVENUE
              </span>
              <span
                className="font-mono text-[14px] text-muted group-hover:text-accent transition-colors"
                aria-hidden="true"
              >
                ₹
              </span>
            </div>
            <p className="font-serif text-[28px] md:text-[32px] font-normal text-primary m-0 leading-tight">
              ₹{Math.round(totalRevenue).toLocaleString("en-IN")}
            </p>
            <p className="font-mono text-[10px] text-muted mt-2 m-0">
              All time
            </p>
          </Link>
        )}

        {activeOrders >= 1 && (
          <Link
            href="/orders"
            role="listitem"
            className="premium-card p-5 block no-underline group hover:border-accent/40 transition-all rounded-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted">
                RECENT ORDERS
              </span>
              <span
                className="font-mono text-[14px] text-muted group-hover:text-accent transition-colors"
                aria-hidden="true"
              >
                📦
              </span>
            </div>
            <p className="font-serif text-[28px] md:text-[32px] font-normal text-primary m-0 leading-tight">
              {activeOrders}
            </p>
            <p className="font-mono text-[10px] text-muted mt-2 m-0">
              D2C &amp; B2B active
            </p>
          </Link>
        )}

        {pendingRfqs >= 1 && (
          <Link
            href="/rfqs"
            role="listitem"
            className="premium-card p-5 block no-underline group border-[#D6A24A]/40 bg-[#D6A24A]/10 hover:border-[#D6A24A]/70 transition-all rounded-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-[#D6A24A] font-semibold">
                RFQS PENDING
              </span>
              <span
                className="font-mono text-[14px] text-[#D6A24A]"
                aria-hidden="true"
              >
                ⚠
              </span>
            </div>
            <p className="font-serif text-[28px] md:text-[32px] font-normal text-[#D6A24A] m-0 leading-tight">
              {pendingRfqs}
            </p>
            <p className="font-mono text-[10px] text-[#D6A24A]/80 mt-2 m-0">
              Needs review today
            </p>
          </Link>
        )}

        {b2bRegistrations >= 1 && (
          <Link
            href="/b2b"
            role="listitem"
            className="premium-card p-5 block no-underline group hover:border-accent/40 transition-all rounded-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted">
                B2B ACCOUNTS
              </span>
              <span
                className="font-mono text-[14px] text-muted group-hover:text-accent transition-colors"
                aria-hidden="true"
              >
                👥
              </span>
            </div>
            <p className="font-serif text-[28px] md:text-[32px] font-normal text-primary m-0 leading-tight">
              {b2bRegistrations}
            </p>
            <p className="font-mono text-[10px] text-muted mt-2 m-0">
              {pendingB2B} pending
            </p>
          </Link>
        )}

        {/* Support Tickets Count Card */}
        {openTicketsCount >= 1 && (
          <Link
            href="/tickets"
            role="listitem"
            className={`premium-card p-5 block no-underline group transition-all rounded-lg ${
              openTicketsCount > 0
                ? "border-amber-500/40 bg-amber-500/5 hover:border-amber-500/70"
                : "hover:border-accent/40"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span
                className={`font-mono text-[10px] tracking-[0.15em] uppercase font-semibold ${
                  openTicketsCount > 0 ? "text-amber-500" : "text-muted"
                }`}
              >
                TICKETS ACTIVE
              </span>
              <span
                className={`font-mono text-[14px] ${openTicketsCount > 0 ? "text-amber-500" : "text-muted"}`}
                aria-hidden="true"
              >
                🎫
              </span>
            </div>
            <p
              className={`font-serif text-[28px] md:text-[32px] font-normal m-0 leading-tight ${
                openTicketsCount > 0 ? "text-amber-500" : "text-primary"
              }`}
            >
              {openTicketsCount}
            </p>
            <p className="font-mono text-[10px] text-muted mt-2 m-0">
              Support requests
            </p>
          </Link>
        )}

        {/* Inquiries Count Card */}
        {newInquiriesCount >= 1 && (
          <Link
            href="/inquiries"
            role="listitem"
            className={`premium-card p-5 block no-underline group transition-all rounded-lg ${
              newInquiriesCount > 0
                ? "border-sky-500/40 bg-sky-500/5 hover:border-sky-500/70"
                : "hover:border-accent/40"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span
                className={`font-mono text-[10px] tracking-[0.15em] uppercase font-semibold ${
                  newInquiriesCount > 0 ? "text-sky-400" : "text-muted"
                }`}
              >
                NEW LEADS
              </span>
              <span
                className={`font-mono text-[14px] ${newInquiriesCount > 0 ? "text-sky-400" : "text-muted"}`}
                aria-hidden="true"
              >
                ✉
              </span>
            </div>
            <p
              className={`font-serif text-[28px] md:text-[32px] font-normal m-0 leading-tight ${
                newInquiriesCount > 0 ? "text-sky-400" : "text-primary"
              }`}
            >
              {newInquiriesCount}
            </p>
            <p className="font-mono text-[10px] text-muted mt-2 m-0">
              Contact inquiries
            </p>
          </Link>
        )}
      </div>

      {/* Main Dashboard Panels */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Panel 1: Recent Orders */}
        <section
          className="premium-card flex flex-col overflow-hidden rounded-lg"
          aria-labelledby="ordersTitle"
        >
          <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-surface-muted/40">
            <h2
              className="font-serif text-[20px] text-primary font-normal m-0"
              id="ordersTitle"
            >
              Recent orders
            </h2>
            <Link
              href="/orders"
              className="btn-ghost font-mono text-[10px] uppercase tracking-[0.12em]"
            >
              View all
            </Link>
          </div>

          <div className="table-responsive flex-1">
            <table className="w-full text-left border-collapse">
              <caption className="sr-only">
                Recent orders with customer, amount and status
              </caption>
              <thead className="border-b border-border bg-surface-muted/20">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal"
                  >
                    Order
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal"
                  >
                    Customer
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal text-right"
                  >
                    Amount
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal"
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {orders.map((o: any) => {
                  const s = (o.status || "").toUpperCase();
                  const isPaid = [
                    "DELIVERED",
                    "PAID",
                    "SUCCESS",
                    "SHIPPED",
                  ].includes(s);
                  const isProcessing = ["PROCESSING", "SUBMITTED"].includes(s);

                  const pillClass = isPaid
                    ? "status-paid"
                    : isProcessing
                      ? "status-processing"
                      : "status-pending";

                  return (
                    <ClickableRow
                      key={o.id}
                      href={`/orders/${o.id}`}
                      className="hover:bg-surface-muted/40 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono text-[12px] text-accent hover:underline font-semibold">
                          {o.orderNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-serif text-[15px] text-primary">
                        {o.user.firstName} {o.user.lastName}
                      </td>
                      <td className="px-6 py-4 font-mono text-[13px] text-primary text-right tabular-nums">
                        ₹{Math.round(o.totalAmount).toLocaleString("en-IN")}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`status-pill ${pillClass}`}>
                          <span className="dot" aria-hidden="true" />
                          <span>{s.replace("_", " ")}</span>
                        </span>
                      </td>
                    </ClickableRow>
                  );
                })}
                {orders.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-8 text-center text-muted font-mono text-[10px] uppercase tracking-widest"
                    >
                      No recent orders.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Panel 2: Needs Review (RFQs) */}
        <section
          className="premium-card flex flex-col overflow-hidden rounded-lg"
          aria-labelledby="rfqTitle"
        >
          <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-surface-muted/40">
            <h2
              className="font-serif text-[20px] text-primary font-normal m-0"
              id="rfqTitle"
            >
              Needs review · {pendingRfqs}
            </h2>
            <Link
              href="/rfqs"
              className="btn-ghost font-mono text-[10px] uppercase tracking-[0.12em]"
            >
              Open inbox
            </Link>
          </div>

          <div className="divide-y divide-border/40 p-2">
            {rfqs.map((r: any) => {
              const initials = getInitials(r.user.firstName, r.user.lastName);
              const itemCount = r.items?.length || 0;
              const timeAgo = formatTimeAgo(r.createdAt);

              return (
                <Link
                  key={r.id}
                  href={`/rfqs/${r.id}`}
                  className="p-4 flex items-center gap-3.5 hover:bg-surface-muted/40 transition-colors rounded-sm no-underline block group"
                >
                  {/* User Avatar Circle */}
                  <div
                    className="w-9 h-9 rounded-full border border-accent/40 bg-accent/5 flex items-center justify-center font-serif text-[13px] text-accent shrink-0"
                    aria-hidden="true"
                  >
                    {initials}
                  </div>

                  {/* Metadata */}
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-[15px] text-primary m-0 font-normal leading-snug truncate">
                      {r.user.firstName} {r.user.lastName}
                    </p>
                    <p className="font-mono text-[10px] text-muted m-0 mt-0.5 tracking-wide truncate">
                      {r.rfqNumber} · {itemCount}{" "}
                      {itemCount === 1 ? "item" : "items"} · {timeAgo}
                    </p>
                  </div>

                  {/* Review Action Deep-Link */}
                  <span className="px-4 py-2 border border-accent/50 text-accent group-hover:bg-accent group-hover:text-black transition-all font-mono text-[10px] uppercase tracking-[0.12em] rounded-sm font-semibold shrink-0">
                    Review
                  </span>
                </Link>
              );
            })}

            {rfqs.length === 0 && (
              <div className="p-8 text-center text-muted font-mono text-[10px] uppercase tracking-widest">
                No RFQs require attention.
              </div>
            )}
          </div>
        </section>

        {/* Panel 3: Active Support Tickets */}
        <section
          className="premium-card flex flex-col overflow-hidden rounded-lg"
          aria-labelledby="ticketsTitle"
        >
          <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-surface-muted/40">
            <h2
              className="font-serif text-[20px] text-primary font-normal m-0"
              id="ticketsTitle"
            >
              Active tickets · {openTicketsCount}
            </h2>
            <Link
              href="/tickets"
              className="btn-ghost font-mono text-[10px] uppercase tracking-[0.12em]"
            >
              Open Inbox
            </Link>
          </div>

          <div className="table-responsive flex-1">
            <table className="w-full text-left border-collapse">
              <caption className="sr-only">Active support tickets</caption>
              <thead className="border-b border-border bg-surface-muted/20">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal"
                  >
                    Ticket
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal"
                  >
                    Customer
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal text-right"
                  >
                    Age
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {tickets.map((t: any) => {
                  const s = (t.status || "").toUpperCase();
                  const isPending = s === "OPEN";
                  const isProcessing = s === "IN_PROGRESS";
                  const pillClass = isPending
                    ? "status-processing"
                    : isProcessing
                      ? "status-paid"
                      : "status-pending";

                  return (
                    <ClickableRow
                      key={t.id}
                      href={`/tickets/${t.id}`}
                      className="hover:bg-surface-muted/40 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono text-[12px] text-accent hover:underline font-semibold">
                          {t.ticketNumber}
                        </span>
                        <div className="text-[12px] text-primary font-serif truncate max-w-[150px] mt-0.5">
                          {t.subject}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-serif text-[14px] text-primary">
                          {t.user?.firstName} {t.user?.lastName}
                        </div>
                        <div className="font-mono text-[10px] text-muted">
                          {t.user?.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`status-pill ${pillClass}`}>
                          <span className="dot" aria-hidden="true" />
                          <span>{s.replace("_", " ")}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-[11px] text-secondary">
                        {formatTimeAgo(t.createdAt)}
                      </td>
                    </ClickableRow>
                  );
                })}
                {tickets.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-8 text-center text-muted font-mono text-[10px] uppercase tracking-widest"
                    >
                      No active tickets.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Panel 4: New Inquiries Leads */}
        <section
          className="premium-card flex flex-col overflow-hidden rounded-lg"
          aria-labelledby="inquiriesTitle"
        >
          <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-surface-muted/40">
            <h2
              className="font-serif text-[20px] text-primary font-normal m-0"
              id="inquiriesTitle"
            >
              New Leads · {newInquiriesCount}
            </h2>
            <Link
              href="/inquiries"
              className="btn-ghost font-mono text-[10px] uppercase tracking-[0.12em]"
            >
              Open Inquiries
            </Link>
          </div>

          <div className="divide-y divide-border/40 p-2">
            {inquiries.map((inq: any) => {
              const initials = getInitials(inq.name || inq.email, "");
              const timeAgo = formatTimeAgo(inq.createdAt);

              return (
                <Link
                  key={inq.id}
                  href={`/inquiries`}
                  className="p-4 flex items-center gap-3.5 hover:bg-surface-muted/40 transition-colors rounded-sm no-underline block group"
                >
                  <div
                    className="w-9 h-9 rounded-full border border-sky-400/40 bg-sky-400/5 flex items-center justify-center font-serif text-[13px] text-sky-400 shrink-0"
                    aria-hidden="true"
                  >
                    {initials}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-[15px] text-primary m-0 font-normal leading-snug truncate">
                      {inq.name || inq.email}
                    </p>
                    <p className="font-mono text-[10px] text-muted m-0 mt-0.5 tracking-wide truncate">
                      {inq.subject} · {inq.recipient} · {timeAgo}
                    </p>
                  </div>

                  <span className="px-3 py-1.5 border border-sky-400/50 text-sky-400 group-hover:bg-sky-400 group-hover:text-black transition-all font-mono text-[9px] uppercase tracking-[0.12em] rounded-sm font-semibold shrink-0">
                    View
                  </span>
                </Link>
              );
            })}

            {inquiries.length === 0 && (
              <div className="p-8 text-center text-muted font-mono text-[10px] uppercase tracking-widest">
                No new inquiries.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
