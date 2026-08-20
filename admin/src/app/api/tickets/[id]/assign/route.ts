import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin email whitelist
    const whitelisted = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];
    const adminEmails = [
      'abhishikt@growth-ho.com',
      'admin@jamesandsons.in',
      'vishal@jamesandsons.in',
      'james@jamesandsons.in',
      ...whitelisted
    ];
    if (!adminEmails.includes(user.email || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { assignedToId } = await req.json();

    // 1. Fetch target admin details if assigning
    let targetAdminName = 'Unassigned';
    if (assignedToId) {
      const adminUser = await prisma.user.findUnique({
        where: { id: assignedToId }
      });
      if (adminUser) {
        targetAdminName = `${adminUser.firstName} ${adminUser.lastName}`;
      }
    }

    // 2. Fetch current ticket to verify if it exists
    const currentTicket = await prisma.ticket.findUnique({
      where: { id }
    });
    if (!currentTicket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // 3. Update the ticket and log the assignment action
    const updatedTicket = await prisma.$transaction(async (tx) => {
      const t = await tx.ticket.update({
        where: { id },
        data: {
          assignedToId: assignedToId || null,
          // Auto transition OPEN tickets to IN_PROGRESS upon assignment
          status: currentTicket.status === 'OPEN' && assignedToId ? 'IN_PROGRESS' : currentTicket.status
        },
        include: {
          assignedTo: true,
          user: true
        }
      });

      await tx.ticketAuditLog.create({
        data: {
          ticketId: id,
          actorId: user.id,
          actionType: 'ASSIGNED',
          details: assignedToId ? `Assigned to ${targetAdminName}` : 'Unassigned the ticket'
        }
      });

      return t;
    });

    return NextResponse.json(updatedTicket);
  } catch (error: any) {
    console.error('Failed to assign ticket:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
