'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

const STATUS_OPTIONS = [
  { value: 'OPEN', label: 'Open', color: 'text-amber-500' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: 'text-sky-400' },
  { value: 'RESOLVED', label: 'Resolved', color: 'text-emerald-400' },
  { value: 'CLOSED', label: 'Closed', color: 'text-muted' },
];

export default function TicketStatusChanger({
  ticketId,
  currentStatus,
}: {
  ticketId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(currentStatus);

  const handleChange = (newStatus: string) => {
    setStatus(newStatus);
    startTransition(async () => {
      try {
        await fetch(`/api/tickets/${ticketId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });
        router.refresh();
      } catch {
        setStatus(currentStatus);
      }
    });
  };

  const current = STATUS_OPTIONS.find((s) => s.value === status);

  return (
    <select
      value={status}
      disabled={isPending}
      onChange={(e) => handleChange(e.target.value)}
      className={`bg-surface/80 border border-border text-[9px] font-mono uppercase tracking-wider px-2 py-1 focus:outline-none focus:border-accent transition-all rounded-[4px] cursor-pointer disabled:opacity-50 shrink-0 ${current?.color ?? 'text-muted'}`}
    >
      {STATUS_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}
