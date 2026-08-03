"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, RefreshCw } from "lucide-react";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isSyncingAmazon, setIsSyncingAmazon] = useState(false);

  const handleSyncAmazon = async () => {
    setIsSyncingAmazon(true);
    try {
      const res = await syncAmazonOrdersAction(1440);
      if (res.success) {
        alert(`✅ Amazon Order Sync Complete!\n\n${res.message}`);
      } else {
        alert(`❌ Sync failed: ${res.error}`);
      }
    } catch (err: any) {
      alert(`❌ Sync error: ${err?.message || err}`);
    } finally {
      setIsSyncingAmazon(false);
    }
  };

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
      if (statusFilter === "PAID") {
        matchesStatus = ["DELIVERED", "PAID", "SUCCESS", "SHIPPED"].includes(s);
      } else if (statusFilter === "PROCESSING") {
        matchesStatus = ["PENDING", "PROCESSING", "SUBMITTED"].includes(s);
      } else if (statusFilter === "CANCELLED") {
        matchesStatus = ["CANCELLED", "REFUNDED", "FAILED"].includes(s);
      }

      return matchesSearch && matchesStatus;
    });
  }, [records, searchTerm, statusFilter]);

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
      r.channel || "JNS_STOREFRONT",
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
    link.setAttribute(
      "download",
      `james-and-sons-orders-${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 premium-card p-6 rounded-lg">
        <div>
          <h1 className="font-serif text-[28px] font-normal text-primary tracking-wide m-0">
            Orders &amp; Logistics
          </h1>
          <p className="font-body text-muted text-[13px] mt-1 m-0">
            Manage incoming customer payments, D2C dispatches, and order
            fulfillment.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSyncAmazon}
            disabled={isSyncingAmazon}
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent border border-accent/40 bg-accent/5 px-4 py-2.5 hover:bg-accent/15 hover:border-accent transition-colors rounded-sm cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw
              className={`w-3 h-3 ${isSyncingAmazon ? "animate-spin" : ""}`}
            />
            {isSyncingAmazon ? "Syncing Amazon..." : "Sync Amazon Orders"}
          </button>
          <button
            onClick={handleExportCSV}
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-secondary border border-border px-4 py-2.5 hover:bg-surface-muted hover:text-primary transition-colors bg-background rounded-sm cursor-pointer"
          >
            Export CSV ({filteredRecords.length})
          </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="premium-card flex flex-col overflow-hidden rounded-lg">
        {/* Controls: Search and Filters */}
        <div className="p-4 md:p-6 border-b border-border flex flex-col sm:flex-row gap-3 bg-surface-muted/40 items-stretch sm:items-center justify-between">
          <div className="flex-1 flex items-center gap-2 border border-border bg-background px-3 py-2.5 rounded-sm focus-within:border-accent min-h-[44px]">
            <Search
              className="w-3.5 h-3.5 text-muted shrink-0"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Order ID, Customer, or Email..."
              className="bg-transparent text-primary font-mono text-[12px] focus:outline-none focus-visible:outline-none w-full placeholder:text-muted/60"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="text-muted hover:text-primary font-mono text-[10px] uppercase"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              aria-label="Filter by Status"
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-2.5 min-h-[44px] border border-border bg-background text-secondary font-mono text-[11px] uppercase tracking-wider focus:outline-none focus:border-accent transition-colors cursor-pointer rounded-sm"
            >
              <option value="ALL">All Statuses ({records.length})</option>
              <option value="PAID">Paid / Delivered / Shipped</option>
              <option value="PROCESSING">Pending / Processing</option>
              <option value="CANCELLED">Cancelled / Refunded</option>
            </select>
          </div>
        </div>

        {/* Desktop Table (md+) */}
        <div className="hidden md:block table-responsive flex-1">
          <table className="w-full text-left border-collapse">
            <caption className="sr-only">List of customer orders</caption>
            <thead className="border-b border-border bg-surface-muted/20">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3.5 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal"
                >
                  Order ID
                </th>
                <th
                  scope="col"
                  className="px-6 py-3.5 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal"
                >
                  Date
                </th>
                <th
                  scope="col"
                  className="px-6 py-3.5 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal"
                >
                  Customer / Company
                </th>
                <th
                  scope="col"
                  className="px-6 py-3.5 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal text-right"
                >
                  Total Amount
                </th>
                <th
                  scope="col"
                  className="px-6 py-3.5 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3.5 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal text-right"
                >
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredRecords.map((record) => {
                const s = (record.status || "").toUpperCase();
                const isPaid = [
                  "DELIVERED",
                  "PAID",
                  "SUCCESS",
                  "SHIPPED",
                ].includes(s);
                const isProcessing = ["PENDING", "PROCESSING"].includes(s);
                const pillClass = isPaid
                  ? "status-paid"
                  : isProcessing
                    ? "status-processing"
                    : "status-pending";
                const href = `/orders/${record.id}`;
                return (
                  <ClickableRow
                    key={record.id}
                    href={href}
                    className="hover:bg-surface-muted/40 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[12px] text-accent hover:underline font-semibold">
                          {record.displayId}
                        </span>
                        {record.channel &&
                          record.channel !== "JNS_STOREFRONT" && (
                            <span className="font-mono text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded border border-accent/30 text-accent bg-accent/5">
                              {record.channel.replace(/_/g, " ")}
                            </span>
                          )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-[11px] text-muted">
                      {new Date(record.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-serif text-[15px] text-primary">
                        {record.company || record.customerName}
                      </div>
                      <div className="font-mono text-[10px] text-muted mt-0.5 tracking-wide">
                        {record.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-[13px] text-primary text-right tabular-nums">
                      ₹{Math.round(record.totalValue).toLocaleString("en-IN")}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`status-pill ${pillClass}`}>
                        <span className="dot" aria-hidden="true" />
                        <span>{s.replace(/_/g, " ")}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={href}
                        className="font-mono text-[10px] uppercase tracking-[0.12em] text-accent hover:text-white transition-colors"
                      >
                        View Details →
                      </Link>
                    </td>
                  </ClickableRow>
                );
              })}
              {filteredRecords.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-muted font-mono text-[11px] uppercase tracking-widest"
                  >
                    No matching customer orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View (< md) */}
        <div className="block md:hidden p-4 space-y-3">
          {filteredRecords.map((record) => {
            const s = (record.status || "").toUpperCase();
            const isPaid = ["DELIVERED", "PAID", "SUCCESS", "SHIPPED"].includes(
              s,
            );
            const isProcessing = ["PENDING", "PROCESSING"].includes(s);
            const pillClass = isPaid
              ? "status-paid"
              : isProcessing
                ? "status-processing"
                : "status-pending";
            const href = `/orders/${record.id}`;
            return (
              <div
                key={record.id}
                className="bg-surface border border-border rounded-lg overflow-hidden"
              >
                {/* Card Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-surface-muted/30 border-b border-border/40">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[13px] text-accent font-semibold tracking-wide">
                      {record.displayId}
                    </span>
                    {record.channel && record.channel !== "JNS_STOREFRONT" && (
                      <span className="font-mono text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded border border-accent/30 text-accent bg-accent/5">
                        {record.channel.replace(/_/g, " ")}
                      </span>
                    )}
                  </div>
                  <span className={`status-pill ${pillClass}`}>
                    <span className="dot" aria-hidden="true" />
                    <span>{s.replace(/_/g, " ")}</span>
                  </span>
                </div>

                {/* Card Body */}
                <div className="px-4 py-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-serif text-[15px] text-primary leading-snug">
                        {record.company || record.customerName}
                      </div>
                      <div className="font-mono text-[10px] text-muted mt-0.5 tracking-wide">
                        {record.email}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono text-[12px] text-muted">
                        Amount
                      </div>
                      <div className="font-mono text-[15px] text-primary font-semibold tabular-nums">
                        ₹{Math.round(record.totalValue).toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>
                  <div className="font-mono text-[10px] text-muted/60">
                    {new Date(record.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>

                {/* Card Footer CTA */}
                <div className="px-4 pb-4">
                  <Link
                    href={href}
                    className="w-full flex items-center justify-center gap-2 py-2.5 min-h-[44px] bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 transition-colors font-mono text-[10px] uppercase tracking-[0.12em] rounded-sm"
                  >
                    View Order Details
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>
            );
          })}

          {filteredRecords.length === 0 && (
            <div className="p-8 text-center text-muted font-mono text-[11px] uppercase tracking-widest bg-surface border border-border rounded-lg">
              No matching orders found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
