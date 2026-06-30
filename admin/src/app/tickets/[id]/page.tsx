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
  OPEN: 'text-[#f59e0b] border-[#f59e0b]/20 bg-[#f59e0b]/10',
  IN_PROGRESS: 'text-[#60a5fa] border-[#60a5fa]/20 bg-[#60a5fa]/10',
  RESOLVED: 'text-[#4ade80] border-[#4ade80]/20 bg-[#4ade80]/10',
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
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Panel */}
      <div className="flex justify-between items-center bg-surface p-6 border border-border">
        <div>
          <Link href="/tickets" className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted hover:text-accent mb-4 inline-block transition-colors">
            ← Back to Inbox
          </Link>
          <h1 className="font-serif text-[28px] font-light text-primary tracking-wide m-0">{ticket.subject}</h1>
          <div className="font-mono text-[11px] text-muted mt-2 tracking-widest uppercase flex gap-2 items-center flex-wrap">
            <span>{ticket.ticketNumber}</span>
            <span>·</span>
            <span>{ticket.user.firstName} {ticket.user.lastName} ({ticket.user.email})</span>
            <span>·</span>
            <span className="text-accent">{CATEGORY_LABELS[ticket.category] || ticket.category}</span>
          </div>
        </div>
        <div className="text-right">
          <span className={`font-mono text-[10px] uppercase tracking-[0.15em] px-3 py-1.5 border ${STATUS_COLORS[ticket.status]}`}>
            {STATUS_LABELS[ticket.status]}
          </span>
          {ticket.order && (
            <div className="font-mono text-[11px] text-secondary mt-3">
              Order: <span className="text-accent">#{ticket.order.orderNumber}</span>
            </div>
          )}
        </div>
      </div>

      {/* Selected Items Detail Panel for Returns/Defects */}
      {ticket.orderItems && Array.isArray(ticket.orderItems) && (
        <div className="bg-surface border border-border p-6 space-y-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
            Customer Selected Items for return / issue report
          </div>
          <div className="divide-y divide-border border-t border-b border-border">
            {ticket.orderItems.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center py-3">
                <span className="text-primary font-serif text-[15px]">{item.name}</span>
                <span className="font-mono text-[12px] text-accent">QTY: {item.quantity}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Conversation Box */}
      <div className="bg-surface border border-border flex flex-col">
        {/* Messages */}
        <div className="p-8 flex flex-col gap-6 max-h-[600px] overflow-y-auto">
          {ticket.ticketMessages.map((msg: any) => {
            const isAdmin = msg.authorId === 'ADMIN';
            return (
              <div key={msg.id} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted mb-1.5">
                  {isAdmin ? 'Support Team' : `${ticket.user.firstName}`} · {new Date(msg.createdAt).toLocaleString()}
                </div>
                <div className={`
                  p-4 rounded-[4px] font-body text-[14px] leading-relaxed max-w-[85%] whitespace-pre-wrap
                  ${isAdmin 
                    ? 'bg-accent/10 border border-accent/30 text-primary rounded-tr-none' 
                    : 'bg-background border border-border text-secondary rounded-tl-none'}
                `}>
                  {msg.message}

                  {/* Inline attachments inside messages */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-border">
                      {msg.attachments.map((url: string, imgIdx: number) => {
                        const isPdf = url.toLowerCase().endsWith('.pdf');
                        return (
                          <a 
                            key={imgIdx} 
                            href={url} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="block w-[50px] h-[50px] border border-border rounded-[4px] overflow-hidden bg-background cursor-pointer hover:border-accent"
                          >
                            {isPdf ? (
                              <div className="flex flex-col items-center justify-center h-full text-muted">
                                <span className="text-[8px] font-mono text-red-500">PDF</span>
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
        <div className="p-8 border-t border-border bg-surface text-center flex flex-col items-center justify-center gap-3">
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
              className="font-mono text-[10px] uppercase tracking-[0.1em] text-accent mt-3 hover:underline"
            >
              Open Ticket in Zoho Desk &rarr;
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
