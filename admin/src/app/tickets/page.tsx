import { prisma } from '@/lib/prisma';
import TicketsInbox from './TicketsInbox';

export const dynamic = 'force-dynamic';

export default async function TicketsPage() {
  const tickets = await prisma.ticket.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: true,
      order: true,
      _count: { select: { ticketMessages: true } }
    }
  });

  const openCount = tickets.filter(t => t.status === 'OPEN').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-surface p-6 border border-border">
        <div>
          <h1 className="font-serif text-[28px] font-light text-primary tracking-wide m-0">Support Tickets</h1>
          <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted mt-2">
            {openCount} open · {tickets.length} total
          </p>
        </div>
      </div>
      <TicketsInbox tickets={tickets} />
    </div>
  );
}
