'use server';

import { prisma } from '@/lib/prisma';
import { syncLeadToZoho } from '@/lib/sync/zohoCrm';
import { revalidatePath } from 'next/cache';

export async function updateRfqQuote(
  rfqId: string, 
  items: { id: string; targetPrice: number }[], 
  accept: boolean,
  quotePricing?: {
    discountAmount: number;
    taxAmount: number;
    shippingAmount: number;
    totalAmount: number;
  }
) {
  try {
    // Update individual RFQ items with the admin's approved price
    await prisma.$transaction(
      items.map(item =>
        prisma.rFQItem.update({
          where: { id: item.id },
          data: { 
            approvedPrice: item.targetPrice,
            targetPrice: item.targetPrice 
          },
        })
      )
    );

    // Update the parent RFQ status and pricing summary
    await prisma.rFQ.update({
      where: { id: rfqId },
      data: { 
        status: accept ? 'APPROVED' : 'REJECTED',
        discountAmount: quotePricing?.discountAmount || 0,
        taxAmount: quotePricing?.taxAmount || 0,
        shippingAmount: quotePricing?.shippingAmount || 0,
        totalAmount: quotePricing?.totalAmount || undefined,
      },
    });

    revalidatePath(`/rfqs/${rfqId}`);
    revalidatePath('/rfqs');
    return { success: true };
  } catch (error: any) {
    console.error('[updateRfqQuote] Error:', error);
    return { success: false, error: error.message };
  }
}

export async function syncRfqToZohoAction(rfqId: string) {
  try {
    const rfq = await prisma.rFQ.findUnique({
      where: { id: rfqId },
      include: {
        user: { include: { company: true } },
        items: { include: { product: true } }
      }
    });

    if (!rfq) throw new Error('RFQ not found');

    const leadId = await syncLeadToZoho({
      firstName: rfq.user.firstName,
      lastName: rfq.user.lastName,
      email: rfq.user.email,
      phone: rfq.user.phone || undefined,
      company: rfq.user.company?.name || undefined,
      description: `RFQ Ref: ${rfq.rfqNumber}\nStatus: ${rfq.status}\nProject: ${rfq.projectName || 'N/A'}\nNotes: ${rfq.notes || 'N/A'}`
    });

    return { success: true, leadId };
  } catch (error: any) {
    console.error('[syncRfqToZohoAction] Error:', error);
    return { success: false, error: error.message };
  }
}
