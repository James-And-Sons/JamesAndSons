'use client';
import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'text-[#f59e0b] border-[#f59e0b]/20 bg-[#f59e0b]/10',
  IN_PROGRESS: 'text-[#60a5fa] border-[#60a5fa]/20 bg-[#60a5fa]/10',
  RESOLVED: 'text-[#4ade80] border-[#4ade80]/20 bg-[#4ade80]/10',
  CLOSED: 'text-muted border-border bg-background',
};

type Ticket = {
  id: string;
  ticketNumber: string;
  subject: string;
  status: string;
  createdAt: Date;
  user: { firstName: string; lastName: string; email: string };
  order: { orderNumber: string } | null;
  _count: { ticketMessages: number };
};

export default function TicketsInbox({ tickets }: { tickets: Ticket[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusChange = (ticketId: string, newStatus: string) => {
    setUpdatingId(ticketId);
    startTransition(async () => {
      await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      setUpdatingId(null);
      router.refresh();
    });
  };

  return (
    <div className="bg-surface border border-border overflow-hidden">
      <table className="w-full text-left">
        <thead className="border-b border-border bg-surface-muted">
          <tr>
            <th className="px-6 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">Ticket</th>
            <th className="px-6 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">Customer</th>
            <th className="px-6 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">Order</th>
            <th className="px-6 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">Status</th>
            <th className="px-6 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">Change Status</th>
            <th className="px-6 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal text-right">Msgs</th>
          </tr>
        </thead>
        <tbody>
          {tickets.length === 0 && (
            <tr><td colSpan={6} className="px-6 py-12 text-center font-mono text-[11px] text-muted uppercase tracking-widest">No tickets raised yet</td></tr>
          )}
          {tickets.map(ticket => (
            <tr key={ticket.id} className="border-b border-border hover:bg-surface-muted transition-colors">
              <td className="px-6 py-4">
                <div className="font-mono text-[12px] text-accent">{ticket.ticketNumber}</div>
                <div className="font-serif text-[15px] text-primary mt-1">{ticket.subject}</div>
                <div className="font-body text-[11px] text-muted mt-0.5">{new Date(ticket.createdAt).toLocaleDateString()}</div>
              </td>
              <td className="px-6 py-4">
                <div className="font-serif text-[15px] text-primary">{ticket.user.firstName} {ticket.user.lastName}</div>
                <div className="font-body text-[12px] text-muted">{ticket.user.email}</div>
              </td>
              <td className="px-6 py-4 font-mono text-[12px] text-secondary">
                {ticket.order ? ticket.order.orderNumber : '—'}
              </td>
              <td className="px-6 py-4">
                <span className={`font-mono text-[9px] uppercase tracking-[0.15em] px-2 py-1 border ${STATUS_COLORS[ticket.status]}`}>
                  {STATUS_LABELS[ticket.status]}
                </span>
              </td>
              <td className="px-6 py-4">
                <select
                  defaultValue={ticket.status}
                  disabled={isPending && updatingId === ticket.id}
                  onChange={e => handleStatusChange(ticket.id, e.target.value)}
                  className="bg-background border border-border text-muted font-mono text-[9px] uppercase tracking-widest px-2 py-1.5 focus:outline-none focus:border-accent disabled:opacity-50"
                >
                  {Object.entries(STATUS_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </td>
              <td className="px-6 py-4 text-right font-mono text-[13px] text-secondary">
                {ticket._count.ticketMessages}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
