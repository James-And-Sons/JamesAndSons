"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  RefreshCw,
  Download,
  PackageCheck,
  AlertCircle,
  ShoppingBag,
  Clock,
} from "lucide-react";
import ClickableRow from "@/components/ClickableRow";
import { syncAmazonOrdersAction } from "./actions";

interface OrderItem {
  id: string;
  displayId: string;
  date: Date;
  customerName: string;
  company: string | null;
  email: string;
  totalValue: number;
  status: string;
  channel?: string | null;
}

export default function OrdersTableClient({
  records,
}: {
  records: OrderItem[];
}) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [channelFilter, setChannelFilter] = useState("ALL");
  const [isSyncingAmazon, setIsSyncingAmazon] = useState(false);
  const [lastSyncText, setLastSyncText] = useState<string | null>(null);

  const performAmazonSync = useCallback(
    async (forceManual = false) => {
      const STORAGE_KEY = "jns_amazon_last_sync_timestamp";
      const COOLDOWN_MS = 10 * 60 * 1000; // 10-minute resource optimization throttle

      const lastSyncStr =
        typeof window !== "undefined"
          ? sessionStorage.getItem(STORAGE_KEY)
          : null;
      const lastSyncTime = lastSyncStr ? parseInt(lastSyncStr, 10) : 0;
      const now = Date.now();

      if (!forceManual && lastSyncTime && now - lastSyncTime < COOLDOWN_MS) {
        const minutesAgo = Math.floor((now - lastSyncTime) / 60000);
        setLastSyncText(
          minutesAgo === 0 ? "Synced < 1m ago" : `Synced ${minutesAgo}m ago`,
        );
        return;
      }

      setIsSyncingAmazon(true);
      try {
        const res = await syncAmazonOrdersAction(1440);
        if (res.success) {
          if (typeof window !== "undefined") {
            sessionStorage.setItem(STORAGE_KEY, String(now));
          }
          setLastSyncText("Just synced");
          router.refresh();
          if (forceManual) {
            alert(`✅ Amazon Order Sync Complete!\n\n${res.message}`);
          }
        } else if (forceManual) {
          alert(`❌ Sync failed: ${res.error}`);
        }
      } catch (err: any) {
        if (forceManual) {
          alert(`❌ Sync error: ${err?.message || err}`);
        }
      } finally {
        setIsSyncingAmazon(false);
      }
    },
    [router],
  );

  useEffect(() => {
    performAmazonSync(false);
    const interval = setInterval(
      () => {
        performAmazonSync(false);
      },
      5 * 60 * 1000,
    ); // Check every 5 minutes
    return () => clearInterval(interval);
  }, [performAmazonSync]);

  const handleSyncAmazon = () => {
    performAmazonSync(true);
  };

  const metrics = useMemo(() => {
    const netRev = records
      .filter(
        (r) =>
          !["CANCELLED", "REFUNDED", "FAILED"].includes(r.status.toUpperCase()),
      )
      .reduce((sum, r) => sum + (r.totalValue || 0), 0);

    const readyCount = records.filter((r) =>
      ["PAID", "PROCESSING", "UNSHIPPED", "PENDING"].includes(
        r.status.toUpperCase(),
      ),
    ).length;

    const shippedCount = records.filter((r) =>
      ["SHIPPED", "DELIVERED"].includes(r.status.toUpperCase()),
    ).length;

    const cancelledCount = records.filter((r) =>
      ["CANCELLED", "REFUNDED", "FAILED"].includes(r.status.toUpperCase()),
    ).length;

    const amazonCount = records.filter(
      (r) => (r.channel || "").toUpperCase() === "AMAZON",
    ).length;

    const b2bCount = records.filter(
      (r) => (r.channel || "").toUpperCase() === "B2B",
    ).length;

    const storefrontCount = records.filter(
      (r) =>
        !r.channel ||
        ["D2C", "STOREFRONT", "JNS_STOREFRONT"].includes(
          r.channel.toUpperCase(),
        ),
    ).length;

    return {
      netRev,
      readyCount,
      shippedCount,
      cancelledCount,
      amazonCount,
      b2bCount,
      storefrontCount,
    };
  }, [records]);

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const query = searchTerm.toLowerCase();
      const matchesSearch =
        !query ||
        r.displayId.toLowerCase().includes(query) ||
        r.customerName.toLowerCase().includes(query) ||
        (r.company && r.company.toLowerCase().includes(query)) ||
        r.email.toLowerCase().includes(query);

      const s = r.status.toUpperCase();
      let matchesStatus = true;
      if (statusFilter === "READY_FOR_PICKUP") {
        matchesStatus = ["PAID", "PROCESSING", "UNSHIPPED", "PENDING"].includes(
          s,
        );
      } else if (statusFilter === "SHIPPED") {
        matchesStatus = ["SHIPPED", "DELIVERED"].includes(s);
      } else if (statusFilter === "CANCELLED") {
        matchesStatus = ["CANCELLED", "REFUNDED", "FAILED"].includes(s);
      }

      let matchesChannel = true;
      if (channelFilter === "AMAZON") {
        matchesChannel = (r.channel || "").toUpperCase() === "AMAZON";
      } else if (channelFilter === "B2B") {
        matchesChannel = (r.channel || "").toUpperCase() === "B2B";
      } else if (channelFilter === "STOREFRONT") {
        matchesChannel =
          !r.channel ||
          ["D2C", "STOREFRONT", "JNS_STOREFRONT"].includes(
            r.channel.toUpperCase(),
          );
      }

      return matchesSearch && matchesStatus && matchesChannel;
    });
  }, [records, searchTerm, statusFilter, channelFilter]);

  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      alert("No records to export.");
      return;
    }

    const headers = [
      "Order ID",
      "Date",
      "Customer Name",
      "Company",
      "Email",
      "Total Value",
      "Status",
      "Channel",
    ];
    const rows = filteredRecords.map((r) => [
      r.displayId,
      new Date(r.date).toISOString().split("T")[0],
      r.customerName,
      r.company || "",
      r.email,
      r.totalValue,
      r.status,
      r.channel || "D2C",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Orders_Export_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    if (["PAID", "PROCESSING", "UNSHIPPED", "PENDING"].includes(s)) {
      return (
        <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-[9px] uppercase tracking-wider rounded-xs font-semibold">
          Ready for Pickup
        </span>
      );
    }
    if (["SHIPPED", "DELIVERED"].includes(s)) {
      return (
        <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[9px] uppercase tracking-wider rounded-xs font-semibold">
          Shipped
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 bg-red-500/10 border border-red-500/30 text-red-400 font-mono text-[9px] uppercase tracking-wider rounded-xs font-semibold">
        Cancelled
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ── Stat Cards Header ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 bg-surface border border-border rounded-sm">
          <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted mb-1">
            Net Sales Revenue
          </p>
          <p className="font-serif text-[22px] text-accent font-light">
            ₹{metrics.netRev.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="p-4 bg-surface border border-border rounded-sm">
          <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted mb-1">
            Total Orders
          </p>
          <p className="font-serif text-[22px] text-primary font-light">
            {records.length.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="p-4 bg-surface border border-border rounded-sm">
          <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted mb-1">
            Ready for Pickup
          </p>
          <p className="font-serif text-[22px] text-amber-400 font-light">
            {metrics.readyCount.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="p-4 bg-surface border border-border rounded-sm">
          <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted mb-1">
            Shipped & Delivered
          </p>
          <p className="font-serif text-[22px] text-emerald-400 font-light">
            {metrics.shippedCount.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="p-4 bg-surface border border-border rounded-sm">
          <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted mb-1">
            Amazon.in Orders
          </p>
          <p className="font-serif text-[22px] text-orange-400 font-light">
            {metrics.amazonCount.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="p-4 bg-surface border border-border rounded-sm">
          <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted mb-1">
            Cancelled / Refunded
          </p>
          <p className="font-serif text-[22px] text-red-400 font-light">
            {metrics.cancelledCount.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {/* ── Control Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface p-4 sm:p-6 border border-border rounded-sm">
        <div>
          <h1 className="font-serif text-[28px] font-light text-primary tracking-wide m-0">
            Orders & Fulfillment
          </h1>
          <p className="font-mono text-[10px] text-muted mt-1 tracking-widest uppercase">
            Showing {filteredRecords.length} of {records.length} orders across
            all sales channels
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {lastSyncText && (
            <span className="font-mono text-[9px] text-amber-400/80 bg-amber-500/5 border border-amber-500/20 px-2.5 py-1.5 rounded-xs flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>{lastSyncText}</span>
            </span>
          )}
          <button
            onClick={handleSyncAmazon}
            disabled={isSyncingAmazon}
            className="flex-1 md:flex-initial px-4 py-2.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-all font-mono text-[10px] uppercase tracking-wider rounded-xs flex items-center justify-center gap-2"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isSyncingAmazon ? "animate-spin" : ""}`}
            />
            <span>{isSyncingAmazon ? "Syncing..." : "Sync Amazon Orders"}</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-surface border border-border hover:bg-white/5 transition-all text-muted font-mono text-[10px] uppercase tracking-wider rounded-xs flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* ── Filters Bar ───────────────────────────────────────────────────── */}
      <div className="bg-surface border border-border p-4 space-y-4 rounded-sm">
        <div className="flex flex-col lg:flex-row justify-between gap-4">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search by Order #, Customer Name, Email, or Company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-background border border-border pl-10 pr-4 py-2.5 text-[13px] text-primary focus:outline-none focus:border-accent font-sans"
            />
          </div>

          {/* Channel Filters */}
          <div className="flex flex-wrap gap-1.5 bg-background p-1 border border-border rounded-xs">
            {[
              { id: "ALL", label: "All Channels" },
              { id: "STOREFRONT", label: "D2C Storefront" },
              { id: "AMAZON", label: "Amazon.in" },
              { id: "B2B", label: "B2B Wholesale" },
            ].map((c) => (
              <button
                key={c.id}
                onClick={() => setChannelFilter(c.id)}
                className={`px-3 py-1.5 font-mono text-[9px] uppercase tracking-wider rounded-xs transition-all ${
                  channelFilter === c.id
                    ? "bg-[#C97E6A] text-white font-bold"
                    : "text-muted hover:text-primary"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-border/60">
          {[
            { id: "ALL", label: "All Statuses" },
            { id: "READY_FOR_PICKUP", label: "Ready for Pickup" },
            { id: "SHIPPED", label: "Shipped & Delivered" },
            { id: "CANCELLED", label: "Cancelled / Refunds" },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setStatusFilter(s.id)}
              className={`px-3.5 py-1.5 font-mono text-[9px] uppercase tracking-wider border rounded-xs transition-all ${
                statusFilter === s.id
                  ? "border-accent bg-accent/10 text-accent font-semibold"
                  : "border-border/60 bg-transparent text-muted hover:border-border"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Desktop Orders Table ────────────────────────────────────────── */}
      <div className="bg-surface border border-border overflow-hidden rounded-sm hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-border text-muted bg-background/50">
              <tr>
                <th className="py-3.5 px-6 font-mono text-[9px] uppercase tracking-[0.15em] font-normal">
                  Order #
                </th>
                <th className="py-3.5 px-6 font-mono text-[9px] uppercase tracking-[0.15em] font-normal">
                  Date
                </th>
                <th className="py-3.5 px-6 font-mono text-[9px] uppercase tracking-[0.15em] font-normal">
                  Customer
                </th>
                <th className="py-3.5 px-6 font-mono text-[9px] uppercase tracking-[0.15em] font-normal">
                  Channel
                </th>
                <th className="py-3.5 px-6 font-mono text-[9px] uppercase tracking-[0.15em] font-normal">
                  Total
                </th>
                <th className="py-3.5 px-6 font-mono text-[9px] uppercase tracking-[0.15em] font-normal">
                  Status
                </th>
                <th className="py-3.5 px-6 font-mono text-[9px] uppercase tracking-[0.15em] font-normal text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRecords.map((r) => (
                <ClickableRow key={r.id} href={`/orders/${r.id}`}>
                  <td className="py-4 px-6 font-mono text-[13px] text-accent font-semibold">
                    <Link
                      href={`/orders/${r.id}`}
                      className="hover:underline text-accent"
                    >
                      {r.displayId}
                    </Link>
                  </td>
                  <td className="py-4 px-6 font-mono text-[11px] text-muted">
                    {new Date(r.date).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="py-4 px-6">
                    <Link
                      href={`/orders/${r.id}`}
                      className="font-serif text-[14px] text-primary hover:text-accent font-medium m-0 block"
                    >
                      {r.customerName}
                    </Link>
                    <p className="font-mono text-[10px] text-muted m-0">
                      {r.email}
                    </p>
                    {r.company && (
                      <span className="font-mono text-[9px] text-accent uppercase tracking-wider">
                        🏢 {r.company}
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    {r.channel === "AMAZON" ? (
                      <span className="px-2 py-0.5 bg-orange-500/10 border border-orange-500/30 text-orange-400 font-mono text-[9px] uppercase tracking-wider rounded-xs">
                        ▲ Amazon.in
                      </span>
                    ) : r.channel === "B2B" ? (
                      <span className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/30 text-purple-400 font-mono text-[9px] uppercase tracking-wider rounded-xs">
                        🏢 B2B
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 font-mono text-[9px] uppercase tracking-wider rounded-xs">
                        🛍️ D2C
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 font-mono text-[14px] text-primary font-bold">
                    ₹{r.totalValue.toLocaleString("en-IN")}
                  </td>
                  <td className="py-4 px-6">{getStatusBadge(r.status)}</td>
                  <td className="py-4 px-6 text-right font-mono text-[10px] text-accent uppercase tracking-widest">
                    View Details ↗
                  </td>
                </ClickableRow>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Mobile Orders Card Grid ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3.5 md:hidden">
        {filteredRecords.map((r) => (
          <Link
            key={r.id}
            href={`/orders/${r.id}`}
            className="p-4 bg-surface border border-border rounded-sm block space-y-3 hover:border-accent/40 transition-all"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-mono text-[13px] font-bold text-accent m-0">
                  {r.displayId}
                </p>
                <p className="font-mono text-[10px] text-muted m-0 mt-0.5">
                  {new Date(r.date).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                  })}
                </p>
              </div>
              <div>{getStatusBadge(r.status)}</div>
            </div>

            <div className="border-t border-border/60 pt-2.5 flex justify-between items-end">
              <div>
                <p className="font-serif text-[14px] font-medium text-primary m-0">
                  {r.customerName}
                </p>
                <p className="font-mono text-[10px] text-muted m-0 truncate max-w-[200px]">
                  {r.email}
                </p>
              </div>
              <p className="font-mono text-[15px] font-bold text-primary m-0">
                ₹{r.totalValue.toLocaleString("en-IN")}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
