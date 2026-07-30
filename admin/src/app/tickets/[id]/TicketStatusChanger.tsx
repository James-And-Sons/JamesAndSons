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
    <div className="relative inline-block shrink-0">
      <select
        value={status}
        disabled={isPending}
        onChange={(e) => handleChange(e.target.value)}
        className={`
          appearance-none bg-surface border border-border/80 text-[9.5px] font-mono uppercase tracking-wider pl-3 pr-7 py-1.5
          focus:outline-none focus:border-accent transition-all rounded-[6px] cursor-pointer disabled:opacity-50
          ${current?.color ?? 'text-muted'}
        `}
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-surface text-primary font-mono text-[10px] uppercase">
            {opt.label}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-muted/60">
        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
          <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
      </div>
    </div>
  );
}
