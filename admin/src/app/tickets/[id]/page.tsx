import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import TicketAssignment from './TicketAssignment';
import TicketReplyBox from './TicketReplyBox';
import TicketStatusChanger from './TicketStatusChanger';

export const dynamic = 'force-dynamic';

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'text-amber-500 border-amber-500/30 bg-amber-500/10',
  IN_PROGRESS: 'text-sky-400 border-sky-400/30 bg-sky-400/10',
  RESOLVED: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
  CLOSED: 'text-muted border-border bg-background',
};

const CATEGORY_LABELS: Record<string, string> = {
  GENERAL: 'General Inquiry',
  RETURN: 'Return Request',
  DAMAGE: 'Product Defect / Damage',
  SHIPPING: 'Logistics & Delivery',
  BILLING: 'Billing & Invoice',
};

export default async function AdminTicketDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const currentUser = await requireAdmin();

  const ticket = await prisma.ticket.findUnique({
    where: { id: params.id },
    include: {
      user: true,
      order: true,
      assignedTo: true,
      auditLogs: {
        orderBy: { createdAt: 'desc' },
        include: { actor: true }
      },
      ticketMessages: {
        orderBy: { createdAt: 'asc' },
        include: { author: true }
      }
    }
  });

  if (!ticket) return notFound();

  if (!ticket.readByAdmin) {
    await prisma.ticket.update({
      where: { id: params.id },
      data: { readByAdmin: true }
    });
    ticket.readByAdmin = true;
  }

  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { id: true, firstName: true, lastName: true, email: true }
  });

  return (
    <div className="animate-in fade-in duration-300">

      {/* ── Mobile Layout (<md) ─────────────────────────────────────────────── */}
      <div className="flex md:hidden flex-col h-[100dvh] relative overflow-hidden bg-background">

        {/* Sleek Single-Line Mobile Header Bar */}
        <div className="shrink-0 bg-surface/90 backdrop-blur-md border-b border-border/40 px-4 py-3 flex items-center justify-between gap-3">
          <Link
            href="/tickets"
            className="font-mono text-[10px] uppercase tracking-wider text-accent flex items-center gap-1 shrink-0"
          >
            ← Back
          </Link>

          <div className="flex-1 min-w-0 text-center">
            <h2 className="font-serif text-[13px] text-primary truncate leading-tight">
              {ticket.user.firstName} {ticket.user.lastName}
            </h2>
            <div className="font-mono text-[9px] text-muted uppercase tracking-wider leading-none mt-0.5">
              {ticket.ticketNumber} · {ticket.subject}
            </div>
          </div>

          <TicketStatusChanger
            ticketId={ticket.id}
            currentStatus={ticket.status}
          />
        </div>

        {/* Scrollable Message Thread */}
        <div className="flex-1 overflow-y-auto overscroll-contain" id="mobile-thread">
          <div className="flex flex-col gap-3 p-4 pb-2">

            {/* Category pill at top of thread */}
            <div className="flex justify-center">
              <span className="font-mono text-[9px] uppercase tracking-wider text-muted border border-border/50 bg-surface px-3 py-1 rounded-full">
                {CATEGORY_LABELS[ticket.category] || ticket.category}
              </span>
            </div>

            {ticket.ticketMessages.map((msg: any) => {
              const isNote = msg.isInternalNote;
              let displayName = 'Customer';
              if (msg.isAdmin) {
                displayName = msg.author
                  ? `${msg.author.firstName} ${msg.author.lastName}`
                  : 'Support';
              } else if (msg.author) {
                displayName = `${msg.author.firstName} ${msg.author.lastName}`;
              }

              const timeStr = new Date(msg.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              if (isNote) {
                return (
                  <div key={msg.id} className="flex justify-center">
                    <div className="max-w-[85%] bg-amber-500/5 border border-amber-500/20 rounded-[6px] p-3">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="text-[8px] font-mono uppercase tracking-wider bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-[3px] font-bold">
                          Internal Note
                        </span>
                        <span className="font-mono text-[9px] text-amber-500/60">{displayName} · {timeStr}</span>
                      </div>
                      <p className="font-body text-[12.5px] text-amber-200/80 leading-relaxed italic whitespace-pre-wrap">
                        {msg.message}
                      </p>
                    </div>
                  </div>
                );
              }

              return (
                <div key={msg.id} className={`flex flex-col ${msg.isAdmin ? 'items-end' : 'items-start'}`}>
                  <div className="font-mono text-[9px] text-muted/70 mb-1 px-1">
                    {displayName} · {timeStr}
                  </div>
                  <div className={`
                    px-3.5 py-2.5 rounded-[14px] font-body text-[13px] leading-relaxed max-w-[80%] whitespace-pre-wrap
                    ${msg.isAdmin
                      ? 'bg-accent/15 border border-accent/20 text-primary rounded-tr-[4px]'
                      : 'bg-surface border border-border text-secondary rounded-tl-[4px]'
                    }
                  `}>
                    {msg.message}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-white/10">
                        {msg.attachments.map((url: string, i: number) => (
                          <a key={i} href={url} target="_blank" rel="noreferrer"
                            className="w-12 h-12 border border-border/50 rounded-[4px] overflow-hidden block">
                            {url.toLowerCase().endsWith('.pdf')
                              ? <div className="flex items-center justify-center h-full text-[9px] font-mono text-rose-400 bg-surface-muted">PDF</div>
                              : <img src={url} alt="" className="w-full h-full object-cover" />
                            }
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Floating Reply Composer at bottom */}
        <div className="shrink-0 p-3 bg-background/80 backdrop-blur-sm">
          <TicketReplyBox ticketId={ticket.id} />
        </div>
      </div>


      {/* ── Desktop Layout (>=md) ──────────────────────────────────────────── */}
      <div className="hidden md:block space-y-5 max-w-5xl mx-auto pb-12">
        {/* Header Panel */}
        <div className="flex justify-between items-start premium-card p-6 gap-6">
          <div className="flex-1">
            <Link href="/tickets" className="font-mono text-[9px] uppercase tracking-widest text-muted hover:text-accent mb-4 inline-block transition-colors">
              ← Back to Inbox
            </Link>
            <h1 className="font-serif text-[28px] font-light text-primary tracking-wide m-0">{ticket.subject}</h1>
            <div className="font-mono text-[9px] text-muted mt-2.5 tracking-wider uppercase flex gap-2 items-center flex-wrap">
              <span>{ticket.ticketNumber}</span>
              <span>&middot;</span>
              <span>{ticket.user.firstName} {ticket.user.lastName} ({ticket.user.email})</span>
              <span>&middot;</span>
              <span className="text-accent">{CATEGORY_LABELS[ticket.category] || ticket.category}</span>
            </div>
          </div>
          <div className="text-right flex flex-col items-end gap-3">
            <span className={`font-mono text-[9px] uppercase tracking-[0.15em] px-3 py-1 rounded-full border ${STATUS_COLORS[ticket.status]}`}>
              {STATUS_LABELS[ticket.status]}
            </span>
            {ticket.order && (
              <div className="font-mono text-[10px] text-secondary">
                Order: <span className="text-accent">#{ticket.order.orderNumber}</span>
              </div>
            )}
          </div>
        </div>

        {/* Assignment Control */}
        <TicketAssignment
          ticketId={ticket.id}
          currentAssigneeId={ticket.assignedToId}
          admins={admins as any}
          currentUser={currentUser}
        />

        {/* Selected Items for Returns/Defects */}
        {ticket.orderItems && Array.isArray(ticket.orderItems) && (
          <div className="premium-card p-6 space-y-4 bg-surface/90">
            <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted border-b border-border/40 pb-2">
              Selected Items for issue / return report
            </div>
            <div className="divide-y divide-border/40">
              {ticket.orderItems.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center py-3">
                  <span className="text-primary font-serif text-[15px]">{item.name}</span>
                  <span className="font-mono text-[11px] text-accent">QTY: {item.quantity}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Message Thread — Desktop */}
        <div className="premium-card overflow-hidden flex flex-col bg-surface/90">
          <div className="p-8 flex flex-col gap-5 max-h-[600px] overflow-y-auto bg-background/25">
            {ticket.ticketMessages.map((msg: any) => {
              const isNote = msg.isInternalNote;
              let displayName = 'Customer';
              if (msg.isAdmin) {
                displayName = msg.author
                  ? `${msg.author.firstName} ${msg.author.lastName}`
                  : 'Support Concierge';
              } else if (msg.author) {
                displayName = `${msg.author.firstName} ${msg.author.lastName}`;
              }

              if (isNote) {
                return (
                  <div key={msg.id} className="flex justify-center">
                    <div className="max-w-[80%] bg-amber-500/5 border border-amber-500/20 rounded-[6px] p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono text-[8px] uppercase tracking-wider bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-[3px] border border-amber-500/20 font-bold">
                          Internal Note
                        </span>
                        <span className="font-mono text-[9px] text-amber-500/60">
                          {displayName} · {new Date(msg.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="font-body text-[13px] text-amber-200/80 leading-relaxed italic whitespace-pre-wrap">
                        {msg.message}
                      </p>
                    </div>
                  </div>
                );
              }

              return (
                <div key={msg.id} className={`flex flex-col ${msg.isAdmin ? 'items-end' : 'items-start'}`}>
                  <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted mb-1.5 flex items-center gap-1.5">
                    <span>{displayName}</span>
                    <span>&middot;</span>
                    <span>{new Date(msg.createdAt).toLocaleString()}</span>
                  </div>
                  <div className={`
                    p-4 rounded-[6px] font-body text-[13px] leading-relaxed max-w-[80%] whitespace-pre-wrap border
                    ${msg.isAdmin
                      ? 'bg-accent/10 border-accent/20 text-primary rounded-tr-[3px]'
                      : 'bg-background border-border text-secondary rounded-tl-[3px]'
                    }
                  `}>
                    {msg.message}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-border/40">
                        {msg.attachments.map((url: string, imgIdx: number) => {
                          const isPdf = url.toLowerCase().endsWith('.pdf');
                          return (
                            <a key={imgIdx} href={url} target="_blank" rel="noreferrer"
                              className="block w-[50px] h-[50px] border border-border rounded-[4px] overflow-hidden bg-background cursor-pointer hover:border-accent transition-colors">
                              {isPdf
                                ? <div className="flex flex-col items-center justify-center h-full">
                                    <span className="text-[8px] font-mono text-rose-500 font-bold">PDF</span>
                                  </div>
                                : <img src={url} alt="Attachment" className="w-full h-full object-cover" />
                              }
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reply Box — Desktop */}
          <div className="border-t border-border/40 bg-surface-muted/30 p-6">
            <TicketReplyBox ticketId={ticket.id} />
          </div>
        </div>

        {/* Activity Timeline */}
        {ticket.auditLogs && ticket.auditLogs.length > 0 && (
          <div className="premium-card p-6 bg-surface/90 space-y-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted border-b border-border/40 pb-2">
              Activity History
            </div>
            <div className="space-y-3 font-mono text-[11px] text-muted">
              {ticket.auditLogs.map((log: any) => (
                <div key={log.id} className="flex justify-between items-center gap-4 py-1 border-b border-border/20 last:border-0">
                  <span>
                    <strong className="text-primary">{log.actor.firstName} {log.actor.lastName}</strong>: {log.details}
                  </span>
                  <span className="text-[10px] text-muted/70 whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
