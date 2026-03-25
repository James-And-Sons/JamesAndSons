import { prisma } from '@/lib/prisma';
import { TicketMessage } from '@prisma/client';
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

  async function addReply(formData: FormData) {
    'use server'
    const message = formData.get('message') as string;
    if (!message.trim()) return;

    // For admin, we use a generic 'Admin' ID or fetch the authenticated admin's ID.
    // Assuming backend logic or generic 'ADMIN' placeholder if auth isn't fully wired for this action.
    await prisma.ticketMessage.create({
      data: {
        ticketId: params.id,
        authorId: 'ADMIN', 
        message
      }
    });

    // Optionally auto-update status to IN_PROGRESS if it was OPEN
    if (ticket?.status === 'OPEN') {
      await prisma.ticket.update({
        where: { id: params.id },
        data: { status: 'IN_PROGRESS' }
      });
    }

    revalidatePath(`/tickets/${params.id}`);
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex justify-between items-center bg-surface p-6 border border-border">
        <div>
          <Link href="/tickets" className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted hover:text-accent mb-4 inline-block transition-colors">
            ← Back to Inbox
          </Link>
          <h1 className="font-serif text-[28px] font-light text-primary tracking-wide m-0">{ticket.subject}</h1>
          <div className="font-mono text-[11px] text-muted mt-2 tracking-widest uppercase">
            {ticket.ticketNumber} · {ticket.user.firstName} {ticket.user.lastName} ({ticket.user.email})
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
                </div>
              </div>
            );
          })}
        </div>

        {/* Reply Area */}
        <div className="p-6 border-t border-border bg-background">
          <form action={addReply} className="flex flex-col gap-4">
            <textarea 
              name="message" 
              required
              rows={4}
              placeholder="Type your response to the customer..."
              className="w-full bg-surface border border-border p-4 text-[14px] font-body text-primary focus:outline-none focus:border-accent resize-vertical"
            />
            <div className="flex justify-end">
              <button type="submit" className="btn-primary font-mono text-[10px] uppercase tracking-[0.1em] px-6 py-3">
                Send Reply
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
