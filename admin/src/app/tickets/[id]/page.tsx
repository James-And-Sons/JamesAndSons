import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';

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
  const ticket = await prisma.ticket.findUnique({
    where: { id: params.id },
    include: {
      user: true,
      order: true,
      ticketMessages: { orderBy: { createdAt: 'asc' } }
    }
  });

  if (!ticket) return notFound();



  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Header Panel */}
      <div className="flex justify-between items-center premium-card p-6">
        <div>
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
        <div className="text-right flex flex-col items-end">
          <span className={`font-mono text-[9px] uppercase tracking-[0.15em] px-3 py-1 rounded-full border ${STATUS_COLORS[ticket.status]}`}>
            {STATUS_LABELS[ticket.status]}
          </span>
          {ticket.order && (
            <div className="font-mono text-[10px] text-secondary mt-3">
              Order: <span className="text-accent">#{ticket.order.orderNumber}</span>
            </div>
          )}
        </div>
      </div>

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
            const isAdmin = msg.authorId === 'ADMIN';
            return (
              <div key={msg.id} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted mb-1.5">
                  {isAdmin ? 'Support Team' : `${ticket.user.firstName}`} &middot; {new Date(msg.createdAt).toLocaleString()}
                </div>
                <div className={`
                  p-4 rounded-[4px] font-body text-[13px] leading-relaxed max-w-[85%] whitespace-pre-wrap
                  ${isAdmin 
                    ? 'bg-accent/10 border border-accent/20 text-primary rounded-tr-none' 
                    : 'bg-background border border-border text-secondary rounded-tl-none'}
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
                              // eslint-disable-next-line @next/next/no-img-element
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

        {/* Reply Area (Managed via Zoho Desk) */}
        <div className="p-8 border-t border-border/40 bg-surface-muted/40 text-center flex flex-col items-center justify-center gap-3">
          <div className="font-serif text-[16px] text-accent flex items-center gap-2">
            <span>⚠️ Managed via Zoho Desk</span>
          </div>
          <p className="font-body text-[13px] text-muted max-w-lg m-0 leading-relaxed">
            This ticket is synchronized with your Zoho Desk helpdesk dashboard. To prevent communication fragmentation, please reply to the customer directly inside Zoho Desk.
          </p>
          {ticket.zohoId && (
            <a 
              href={`https://desk.zoho.in/agent/jamesandsons/james-and-sons/tickets/show/all/${ticket.zohoId}`}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-[9px] uppercase tracking-widest text-accent mt-3 hover:underline border border-accent/25 px-6 py-2.5 hover:bg-accent/5 transition-all bg-background"
            >
              Open Ticket in Zoho Desk &rarr;
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
