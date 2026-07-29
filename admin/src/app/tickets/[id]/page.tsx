import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import TicketAssignment from './TicketAssignment';
import TicketReplyBox from './TicketReplyBox';

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

  // 1. Fetch ticket details with relations
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

  // 2. Automatically mark as read if viewed by an admin
  if (!ticket.readByAdmin) {
    await prisma.ticket.update({
      where: { id: params.id },
      data: { readByAdmin: true }
    });
    ticket.readByAdmin = true;
  }

  // 3. Fetch active admin team members for assignment
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { id: true, firstName: true, lastName: true, email: true }
  });

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-300">
      
      {/* ── Mobile Layout (< md) ────────────────────────────────────────── */}
      <div className="block md:hidden flex flex-col h-[calc(100vh-140px)] min-h-0 relative pb-[120px]">
        {/* Sticky Mobile Chat Header */}
        <div className="sticky top-[64px] z-30 bg-surface/95 backdrop-blur-md border-b border-border flex items-center justify-between p-4 shrink-0">
          <Link href="/tickets" className="font-mono text-[10px] uppercase tracking-wider text-accent flex items-center gap-1">
            &larr; Inbox
          </Link>
          <div className="text-center">
            <div className="font-mono text-[11px] text-primary font-semibold">{ticket.ticketNumber}</div>
            <div className="font-serif text-[12px] text-muted truncate max-w-[160px]">{ticket.subject}</div>
          </div>
          <span className={`font-mono text-[8px] uppercase tracking-[0.12em] px-2 py-0.5 rounded-full border ${STATUS_COLORS[ticket.status]}`}>
            {STATUS_LABELS[ticket.status]}
          </span>
        </div>

        {/* Scrollable Conversation Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/20 scroll-smooth">
          {/* Summary Details inside chat */}
          <div className="p-3 bg-surface border border-border rounded-[4px] space-y-1.5 text-[12px] font-mono text-muted mb-4">
            <div>Customer: <span className="text-primary font-serif">{ticket.user.firstName} {ticket.user.lastName}</span></div>
            <div>Email: <span className="text-secondary">{ticket.user.email}</span></div>
            {ticket.order && <div>Order: <span className="text-accent">#{ticket.order.orderNumber}</span></div>}
          </div>

          {ticket.ticketMessages.map((msg: any) => {
            const isNote = msg.isInternalNote;
            const msgAuthor = msg.author;
            
            let displayName = 'Customer';
            if (msg.isAdmin) {
              displayName = msgAuthor ? `${msgAuthor.firstName} ${msgAuthor.lastName}` : 'Support Concierge';
            } else if (msgAuthor) {
              displayName = `${msgAuthor.firstName} ${msgAuthor.lastName}`;
            }

            return (
              <div key={msg.id} className={`flex flex-col ${msg.isAdmin ? 'items-end' : 'items-start'}`}>
                <div className="font-mono text-[8px] uppercase tracking-[0.1em] text-muted mb-1 flex items-center gap-1.5">
                  <span>{displayName}</span>
                  <span>&middot;</span>
                  <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {isNote && (
                    <span className="text-amber-500 font-bold bg-amber-500/10 px-1 border border-amber-500/20 rounded-[2px] text-[7px]">NOTE</span>
                  )}
                </div>
                <div className={`
                  p-3 rounded-[6px] font-body text-[12.5px] leading-relaxed max-w-[85%] whitespace-pre-wrap border
                  ${isNote 
                    ? 'bg-amber-500/5 border-amber-500/20 text-primary rounded-tr-none'
                    : msg.isAdmin
                      ? 'bg-accent/10 border-accent/20 text-primary rounded-tr-none' 
                      : 'bg-background border-border text-secondary rounded-tl-none'}
                `}>
                  {msg.message}
                </div>
              </div>
            );
          })}
        </div>

        {/* Sticky Mobile Input Form (Pinned above PWA Bottom Nav) */}
        <div className="fixed bottom-[var(--bottom-nav-height,64px)] inset-x-0 bg-surface/90 backdrop-blur-md p-3 border-t border-border z-30">
          <TicketReplyBox ticketId={ticket.id} />
        </div>
      </div>

      {/* ── Desktop Layout (>= md) ──────────────────────────────────────── */}
      <div className="hidden md:block space-y-6 max-w-5xl mx-auto pb-12">
        {/* Header Panel */}
        <div className="flex justify-between items-start premium-card p-6 gap-6">
          <div className="flex-1">
            <Link href="/tickets" className="font-mono text-[9px] uppercase tracking-widest text-muted hover:text-accent mb-4 inline-block transition-colors">
              &larr; Back to Inbox
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

        {/* Assignment Control Box */}
        <TicketAssignment 
          ticketId={ticket.id}
          currentAssigneeId={ticket.assignedToId}
          admins={admins as any}
          currentUser={currentUser}
        />

        {/* Selected Items Detail Panel for Returns/Defects */}
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

        {/* Main Conversation Box */}
        <div className="premium-card overflow-hidden flex flex-col bg-surface/90">
          {/* Messages */}
          <div className="p-8 flex flex-col gap-6 max-h-[600px] overflow-y-auto bg-background/25">
            {ticket.ticketMessages.map((msg: any) => {
              const isNote = msg.isInternalNote;
              const msgAuthor = msg.author;
              
              let displayName = 'Customer';
              if (msg.isAdmin) {
                displayName = msgAuthor ? `${msgAuthor.firstName} ${msgAuthor.lastName}` : 'Support Concierge';
              } else if (msgAuthor) {
                displayName = `${msgAuthor.firstName} ${msgAuthor.lastName}`;
              }

              return (
                <div key={msg.id} className={`flex flex-col ${msg.isAdmin ? 'items-end' : 'items-start'}`}>
                  <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted mb-1.5 flex items-center gap-1.5">
                    <span>{displayName}</span>
                    <span>&middot;</span>
                    <span>{new Date(msg.createdAt).toLocaleString()}</span>
                    {isNote && (
                      <span className="text-amber-500 font-bold bg-amber-500/10 px-1 py-0.5 border border-amber-500/20 rounded-[2px] text-[8px] uppercase tracking-wider">
                        Internal Note
                      </span>
                    )}
                  </div>
                  <div className={`
                    p-4 rounded-[4px] font-body text-[13px] leading-relaxed max-w-[85%] whitespace-pre-wrap border
                    ${isNote 
                      ? 'bg-amber-500/5 border-amber-500/20 text-primary rounded-tr-none'
                      : msg.isAdmin
                        ? 'bg-accent/10 border-accent/20 text-primary rounded-tr-none' 
                        : 'bg-background border-border text-secondary rounded-tl-none'}
                  `}>
                    {msg.message}

                    {/* Inline attachments inside messages */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-border/40">
                        {msg.attachments.map((url: string, imgIdx: number) => {
                          const isPdf = url.toLowerCase().endsWith('.pdf');
                          return (
                            <a 
                              key={imgIdx} 
                              href={url} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="block w-[50px] h-[50px] border border-border rounded-[4px] overflow-hidden bg-background cursor-pointer hover:border-accent transition-colors"
                            >
                              {isPdf ? (
                                <div className="flex flex-col items-center justify-center h-full text-muted bg-surface-muted">
                                  <span className="text-[8px] font-mono text-rose-500 font-bold">PDF</span>
                                </div>
                              ) : (
                                <img src={url} alt="Attachment" className="w-full h-full object-cover" />
                              )}
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

          {/* Reply Box Component */}
          <div className="border-t border-border/40 bg-surface-muted/30 p-6">
            <TicketReplyBox ticketId={ticket.id} />
          </div>
        </div>

        {/* Activity Timeline / Audit Logs */}
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
