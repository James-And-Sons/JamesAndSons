"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import ClickableRow from "@/components/ClickableRow";

export interface InquiryItem {
  id: string;
  email: string;
  name: string | null;
  subject: string;
  message: string;
  recipient: string;
  status: "NEW" | "CONTACTED" | "ARCHIVED";
  createdAt: string | Date;
  updatedAt: string | Date;
}

export default function InquiriesTableClient({
  inquiries: initialInquiries,
}: {
  inquiries: InquiryItem[];
}) {
  const router = useRouter();
  const [inquiries, setInquiries] = useState<InquiryItem[]>(initialInquiries);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryItem | null>(
    null,
  );
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filteredInquiries = useMemo(() => {
    return inquiries.filter((inq) => {
      const q = searchTerm.toLowerCase();
      const name = (inq.name || "").toLowerCase();
      const email = inq.email.toLowerCase();
      const subject = inq.subject.toLowerCase();
      const message = inq.message.toLowerCase();
      const recipient = inq.recipient.toLowerCase();

      const matchesSearch =
        !q ||
        name.includes(q) ||
        email.includes(q) ||
        subject.includes(q) ||
        message.includes(q) ||
        recipient.includes(q);

      const matchesStatus =
        statusFilter === "ALL" || inq.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [inquiries, searchTerm, statusFilter]);

  const newCount = useMemo(
    () => inquiries.filter((i) => i.status === "NEW").length,
    [inquiries],
  );

  const handleUpdateStatus = async (
    id: string,
    newStatus: "NEW" | "CONTACTED" | "ARCHIVED",
  ) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/inquiries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setInquiries((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, status: newStatus } : item,
          ),
        );
        if (selectedInquiry && selectedInquiry.id === id) {
          setSelectedInquiry((prev) =>
            prev ? { ...prev, status: newStatus } : null,
          );
        }
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to update inquiry status:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusPill = (status: string) => {
    switch (status) {
      case "NEW":
        return "text-sky-400 border-sky-400/30 bg-sky-400/10";
      case "CONTACTED":
        return "text-emerald-400 border-emerald-400/30 bg-emerald-400/10";
      case "ARCHIVED":
        return "text-muted border-border bg-background";
      default:
        return "text-muted border-border bg-background";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 premium-card p-6 rounded-lg">
        <div>
          <h1 className="font-serif text-[28px] font-normal text-primary tracking-wide m-0">
            Contact Inquiries
          </h1>
          <p className="font-body text-muted text-[13px] mt-1 m-0">
            Storefront contact form submissions and inbound email inquiries (
            {newCount} new leads requiring response).
          </p>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="premium-card flex flex-col overflow-hidden rounded-lg">
        {/* Controls Bar */}
        <div className="p-4 md:p-6 border-b border-border flex flex-col sm:flex-row gap-3 bg-surface-muted/40 items-stretch sm:items-center justify-between">
          <div className="flex-1 flex items-center gap-2 border border-border bg-background px-3 py-2.5 rounded-sm focus-within:border-accent min-h-[44px]">
            <span className="text-muted text-xs" aria-hidden="true">
              🔍
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by sender name, email, subject, message, or inbox..."
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

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              aria-label="Filter by Status"
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-2.5 min-h-[44px] border border-border bg-background text-secondary font-mono text-[11px] uppercase tracking-wider focus:outline-none focus:border-accent transition-colors cursor-pointer rounded-sm"
            >
              <option value="ALL">All Statuses ({inquiries.length})</option>
              <option value="NEW">New Leads ({newCount})</option>
              <option value="CONTACTED">Contacted / Replied</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>

        {/* Table View */}
        <div className="table-responsive flex-1">
          <table className="w-full text-left border-collapse">
            <caption className="sr-only">Contact form inquiries list</caption>
            <thead className="border-b border-border bg-surface-muted/20">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3.5 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal"
                >
                  Sender
                </th>
                <th
                  scope="col"
                  className="px-6 py-3.5 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal"
                >
                  Subject & Inbox
                </th>
                <th
                  scope="col"
                  className="px-6 py-3.5 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal"
                >
                  Received
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
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredInquiries.map((inq) => {
                const dateStr = new Date(inq.createdAt).toLocaleDateString(
                  "en-IN",
                  {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  },
                );

                return (
                  <tr
                    key={inq.id}
                    className="hover:bg-surface-muted/40 transition-colors cursor-pointer"
                    onClick={() => setSelectedInquiry(inq)}
                  >
                    <td className="px-6 py-4">
                      <div className="font-serif text-[15px] text-primary">
                        {inq.name || "Anonymous Sender"}
                      </div>
                      <div className="font-mono text-[11px] text-accent/90 mt-0.5">
                        {inq.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-serif text-[14px] text-primary font-medium">
                        {inq.subject}
                      </div>
                      <div className="font-mono text-[10px] text-muted mt-0.5">
                        To: {inq.recipient}
                      </div>
                      <div className="font-body text-[12px] text-muted/80 line-clamp-1 mt-1">
                        {inq.message}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-[11px] text-muted">
                      {dateStr}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`font-mono text-[9px] uppercase tracking-[0.12em] px-2.5 py-1 rounded-full border ${getStatusPill(inq.status)}`}
                      >
                        {inq.status}
                      </span>
                    </td>
                    <td
                      className="px-6 py-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => setSelectedInquiry(inq)}
                        className="font-mono text-[10px] uppercase tracking-[0.12em] text-accent hover:text-white transition-colors"
                      >
                        View Details →
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredInquiries.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-muted font-mono text-[11px] uppercase tracking-widest"
                  >
                    No contact inquiries found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inquiry Detail Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div
            className="bg-surface border border-border rounded-lg shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 overflow-hidden max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div>
                <span
                  className={`font-mono text-[9px] uppercase tracking-[0.12em] px-2.5 py-1 rounded-full border ${getStatusPill(selectedInquiry.status)}`}
                >
                  {selectedInquiry.status}
                </span>
                <h2 className="font-serif text-[24px] text-primary mt-3 mb-1">
                  {selectedInquiry.subject}
                </h2>
                <p className="font-mono text-[11px] text-muted">
                  Received{" "}
                  {new Date(selectedInquiry.createdAt).toLocaleString()} · To:{" "}
                  {selectedInquiry.recipient}
                </p>
              </div>
              <button
                onClick={() => setSelectedInquiry(null)}
                className="text-muted hover:text-primary font-mono text-xl p-1"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Sender Info */}
            <div className="bg-surface-muted/30 p-4 rounded-sm border border-border/50 space-y-1">
              <p className="font-mono text-[9px] uppercase tracking-widest text-muted">
                From
              </p>
              <p className="font-serif text-[16px] text-primary">
                {selectedInquiry.name || "Anonymous"}
              </p>
              <p className="font-mono text-[12px] text-accent">
                {selectedInquiry.email}
              </p>
            </div>

            {/* Message Body */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              <p className="font-mono text-[9px] uppercase tracking-widest text-muted">
                Message Content
              </p>
              <div className="bg-background p-4 rounded-sm border border-border/40 font-body text-[14px] text-secondary leading-relaxed whitespace-pre-wrap">
                {selectedInquiry.message}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="border-t border-border pt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase text-muted">
                  Status:
                </span>
                <button
                  disabled={updatingId === selectedInquiry.id}
                  onClick={() => handleUpdateStatus(selectedInquiry.id, "NEW")}
                  className={`font-mono text-[10px] uppercase px-3 py-1.5 rounded border transition-colors ${
                    selectedInquiry.status === "NEW"
                      ? "border-sky-400 bg-sky-400/20 text-sky-400"
                      : "border-border text-muted hover:text-white"
                  }`}
                >
                  NEW
                </button>
                <button
                  disabled={updatingId === selectedInquiry.id}
                  onClick={() =>
                    handleUpdateStatus(selectedInquiry.id, "CONTACTED")
                  }
                  className={`font-mono text-[10px] uppercase px-3 py-1.5 rounded border transition-colors ${
                    selectedInquiry.status === "CONTACTED"
                      ? "border-emerald-400 bg-emerald-400/20 text-emerald-400"
                      : "border-border text-muted hover:text-white"
                  }`}
                >
                  CONTACTED
                </button>
                <button
                  disabled={updatingId === selectedInquiry.id}
                  onClick={() =>
                    handleUpdateStatus(selectedInquiry.id, "ARCHIVED")
                  }
                  className={`font-mono text-[10px] uppercase px-3 py-1.5 rounded border transition-colors ${
                    selectedInquiry.status === "ARCHIVED"
                      ? "border-gray-500 bg-gray-500/20 text-gray-400"
                      : "border-border text-muted hover:text-white"
                  }`}
                >
                  ARCHIVED
                </button>
              </div>

              <a
                href={`mailto:${selectedInquiry.email}?subject=${encodeURIComponent(`Re: ${selectedInquiry.subject}`)}`}
                className="btn-primary font-mono text-[10px] uppercase tracking-widest px-5 py-2.5 flex items-center gap-2 rounded-sm"
              >
                ✉️ Reply via Email
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
