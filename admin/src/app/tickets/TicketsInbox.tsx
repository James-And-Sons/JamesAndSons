"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ClickableRow from "@/components/ClickableRow";

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: "text-amber-500 border-amber-500/30 bg-amber-500/10",
  IN_PROGRESS: "text-sky-400 border-sky-400/30 bg-sky-400/10",
  RESOLVED: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
  CLOSED: "text-muted border-border bg-background",
};

type Ticket = {
  id: string;
  ticketNumber: string;
  subject: string;
  status: string;
  createdAt: Date;
  readByAdmin: boolean;
  assignedToId: string | null;
  assignedTo: { firstName: string; lastName: string } | null;
  user: { firstName: string; lastName: string; email: string };
  order: { orderNumber: string } | null;
  _count: { ticketMessages: number };
};

export default function TicketsInbox({
  tickets,
  currentUser,
}: {
  tickets: Ticket[];
  currentUser: { id: string; email?: string | null };
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "MY_TICKETS" | "UNASSIGNED" | "ALL_OPEN" | "CLOSED"
  >("MY_TICKETS");

  const handleStatusChange = (ticketId: string, newStatus: string) => {
    setUpdatingId(ticketId);
    startTransition(async () => {
      await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      setUpdatingId(null);
      router.refresh();
    });
  };

  const filteredTickets = tickets.filter((ticket) => {
    const isOpen = ticket.status === "OPEN" || ticket.status === "IN_PROGRESS";
    const isClosed = ticket.status === "CLOSED" || ticket.status === "RESOLVED";

    switch (activeTab) {
      case "MY_TICKETS":
        return ticket.assignedToId === currentUser.id && isOpen;
      case "UNASSIGNED":
        return !ticket.assignedToId && isOpen;
      case "ALL_OPEN":
        return isOpen;
      case "CLOSED":
        return isClosed;
      default:
        return true;
    }
  });

  const tabs = [
    {
      id: "MY_TICKETS",
      label: "Assigned to Me",
      count: tickets.filter(
        (t) =>
          t.assignedToId === currentUser.id &&
          (t.status === "OPEN" || t.status === "IN_PROGRESS"),
      ).length,
    },
    {
      id: "UNASSIGNED",
      label: "Unassigned",
      count: tickets.filter(
        (t) =>
          !t.assignedToId &&
          (t.status === "OPEN" || t.status === "IN_PROGRESS"),
      ).length,
    },
    {
      id: "ALL_OPEN",
      label: "All Open",
      count: tickets.filter(
        (t) => t.status === "OPEN" || t.status === "IN_PROGRESS",
      ).length,
    },
    {
      id: "CLOSED",
      label: "Closed",
      count: tickets.filter(
        (t) => t.status === "CLOSED" || t.status === "RESOLVED",
      ).length,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Premium Tabbed Navigation - Horizontally scrollable on mobile */}
      <div className="flex border-b border-border/50 gap-6 px-1 overflow-x-auto flex-nowrap scrollbar-none">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 font-mono text-[10px] uppercase tracking-widest transition-all cursor-pointer relative shrink-0 ${
                isActive
                  ? "text-accent border-b border-accent font-medium"
                  : "text-muted hover:text-primary"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          );
        })}
      </div>

      {/* Mobile Card List View (< md) */}
      <div className="block md:hidden space-y-4">
        {filteredTickets.length === 0 && (
          <div className="premium-card p-12 text-center font-mono text-[11px] text-muted uppercase tracking-widest">
            No tickets in this view
          </div>
        )}
        {filteredTickets.map((ticket) => {
          const handleCardClick = (e: React.MouseEvent) => {
            const target = e.target as HTMLElement;
            const isInteractive =
              target.tagName === "SELECT" ||
              target.tagName === "OPTION" ||
              target.closest("select");

            if (!isInteractive) {
              router.push(`/tickets/${ticket.id}`);
            }
          };

          return (
            <div
              key={ticket.id}
              onClick={handleCardClick}
              className="premium-card p-4 block space-y-3 hover:border-accent/40 transition-colors cursor-pointer"
            >
              {/* Header: ticket number, status, unread indicator */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[12px] text-accent font-semibold">
                    {ticket.ticketNumber}
                  </span>
                  {!ticket.readByAdmin && (
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"
                      title="Unread customer message"
                    />
                  )}
                </div>
                <span
                  className={`font-mono text-[8px] uppercase tracking-[0.12em] px-2 py-0.5 rounded-full border ${STATUS_COLORS[ticket.status]}`}
                >
                  {STATUS_LABELS[ticket.status]}
                </span>
              </div>

              {/* Subject */}
              <h3 className="font-serif text-[16px] text-primary leading-snug">
                {ticket.subject}
              </h3>

              {/* Details */}
              <div className="grid grid-cols-2 gap-2 text-[11px] border-t border-border/30 pt-3 font-mono text-muted">
                <div>
                  <span className="text-[9px] uppercase tracking-wider block text-muted/60">
                    Customer
                  </span>
                  <span className="text-secondary font-serif text-[13px]">
                    {ticket.user?.firstName || "Customer"}{" "}
                    {ticket.user?.lastName || ""}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-wider block text-muted/60">
                    Assignee
                  </span>
                  <span className="text-secondary">
                    {ticket.assignedTo
                      ? `${ticket.assignedTo.firstName || ""} ${ticket.assignedTo.lastName?.charAt(0) || ""}.`
                      : "Unassigned"}
                  </span>
                </div>
              </div>

              {/* Inline interactive select: wrapped in click interceptor to stop propagation */}
              <div
                className="flex items-center justify-between pt-2 border-t border-border/20"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="font-mono text-[9px] uppercase tracking-wider text-muted/60">
                  Messages: {ticket._count.ticketMessages}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-muted/60">
                    Status:
                  </span>
                  <select
                    defaultValue={ticket.status}
                    disabled={isPending && updatingId === ticket.id}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleStatusChange(ticket.id, e.target.value);
                    }}
                    className="bg-background border border-border text-muted font-mono text-[10px] uppercase tracking-wider px-2 py-1 focus:outline-none focus:border-accent focus:text-primary transition-colors disabled:opacity-50 cursor-pointer min-h-[36px]"
                  >
                    {Object.entries(STATUS_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>
                        {val === "IN_PROGRESS" ? "In Prog" : label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table View (>= md) */}
      <div className="hidden md:block premium-card overflow-hidden">
        <table className="w-full text-left">
          <thead className="border-b border-border bg-surface-muted/30">
            <tr>
              <th className="px-6 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">
                Ticket
              </th>
              <th className="px-6 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">
                Customer
              </th>
              <th className="px-6 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">
                Assignee
              </th>
              <th className="px-6 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">
                Order
              </th>
              <th className="px-6 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">
                Status
              </th>
              <th className="px-6 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">
                Change Status
              </th>
              <th className="px-6 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal text-right">
                Msgs
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {filteredTickets.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-12 text-center font-mono text-[11px] text-muted uppercase tracking-widest"
                >
                  No tickets in this view
                </td>
              </tr>
            )}
            {filteredTickets.map((ticket) => (
              <ClickableRow
                key={ticket.id}
                href={`/tickets/${ticket.id}`}
                className="hover:bg-surface-muted/50 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[12px] text-accent font-semibold hover:underline">
                      {ticket.ticketNumber}
                    </span>
                    {!ticket.readByAdmin && (
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"
                        title="Unread customer message"
                      />
                    )}
                  </div>
                  <div className="font-serif text-[15px] text-primary mt-1 hover:text-accent transition-colors">
                    {ticket.subject}
                  </div>
                  <div className="font-mono text-[10px] text-muted mt-1">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-sans text-[14px] text-primary font-medium">
                    {ticket.user?.firstName || "Customer"}{" "}
                    {ticket.user?.lastName || ""}
                  </div>
                  <div className="font-body text-[12px] text-muted">
                    {ticket.user?.email || "No Email"}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {ticket.assignedTo ? (
                    <span className="font-body text-[13px] text-primary bg-accent/5 border border-accent/10 px-2 py-1 rounded">
                      {ticket.assignedTo.firstName || ""}{" "}
                      {ticket.assignedTo.lastName?.charAt(0) || ""}.
                    </span>
                  ) : (
                    <span className="font-mono text-[10px] uppercase text-muted tracking-wider">
                      Unassigned
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 font-mono text-[12px] text-secondary">
                  {ticket.order ? ticket.order.orderNumber : "—"}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`font-mono text-[9px] uppercase tracking-[0.12em] px-3 py-1 rounded-full border ${STATUS_COLORS[ticket.status]}`}
                  >
                    {STATUS_LABELS[ticket.status]}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <select
                    defaultValue={ticket.status}
                    disabled={isPending && updatingId === ticket.id}
                    onChange={(e) =>
                      handleStatusChange(ticket.id, e.target.value)
                    }
                    className="bg-background border border-border text-muted font-mono text-[11px] uppercase tracking-widest px-3 py-2 focus:outline-none focus:border-accent focus:text-primary transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {Object.entries(STATUS_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>
                        {label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-4 text-right font-mono text-[13px] text-secondary tabular-nums">
                  {ticket._count.ticketMessages}
                </td>
              </ClickableRow>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
