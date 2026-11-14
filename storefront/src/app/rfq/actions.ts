'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';

export async function getLoggedInUserAction() {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) return null;
    const dbUser = await prisma.user.findUnique({
      where: { id: data.user.id },
      include: { company: true }
    });
    return dbUser;
  } catch (error) {
    return null;
  }
}

export async function submitRfqAction(
  userId: string, 
  data: { 
    projectName?: string; 
    timeline?: string; 
    notes?: string; 
    channel?: string;
    items: { productId: string; quantity: number; targetPrice?: string; customSpecs?: any }[] 
  }
) {
  try {
    const rfqNumber = `RFQ-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

    const rfq = await prisma.rFQ.create({
      data: {
        userId,
        status: 'SUBMITTED',
        channel: data.channel || 'STOREFRONT_RFQ',
        projectName: data.projectName || null,
        timeline: data.timeline || null,
        notes: data.notes || null,
        rfqNumber,
        items: {
          create: data.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            targetPrice: item.targetPrice ? parseFloat(item.targetPrice.replace(/[^0-9.]/g, '')) : null,
            customSpecs: item.customSpecs || undefined,
          })),
        },
      },
    });

    revalidatePath('/account/rfqs');
    revalidatePath('/account');
    return { success: true, id: rfq.id, rfqNumber: rfq.rfqNumber };
  } catch (error: any) {
    console.error('[submitRfqAction] Error:', error);
    return { success: false, error: error.message };
  }
}

export async function submitQuickInquiryAction(data: {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  projectName?: string;
  productId: string;
  quantity: number;
  targetPrice?: string;
  customSpecsNotes?: string;
  channel?: string;
  pincode?: string;
}) {
  try {
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanPhone = (data.phone || '').replace(/\D/g, '').slice(-10);
    const nameParts = data.name.trim().split(/\s+/);
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts.slice(1).join(' ') || '.';

    // 1. Resolve or Create Company
    let companyId: string | null = null;
    if (data.company && data.company.trim()) {
      const companyName = data.company.trim();
      let company = await prisma.company.findFirst({
        where: { name: { equals: companyName, mode: 'insensitive' } }
      });
      if (!company) {
        company = await prisma.company.create({
          data: { name: companyName }
        });
      }
      companyId = company.id;
    }

    // 2. Resolve or Create User
    let user = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: cleanEmail,
          firstName,
          lastName,
          password: 'guest',
          phone: cleanPhone || null,
          companyId,
          role: 'CUSTOMER'
        }
      });
    }

    const rfqNumber = `INQ-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

    const formattedNotes = `Delivery Pincode: ${data.pincode || 'N/A'}\nSpecs & Notes: ${data.customSpecsNotes || 'None'}`;

    // 3. Create RFQ Record
    const rfq = await prisma.rFQ.create({
      data: {
        userId: user.id,
        status: 'SUBMITTED',
        channel: data.channel || 'PRODUCT_INQUIRY',
        projectName: data.projectName || null,
        notes: formattedNotes,
        rfqNumber,
        items: {
          create: [
            {
              productId: data.productId,
              quantity: data.quantity,
              targetPrice: data.targetPrice ? parseFloat(data.targetPrice.replace(/[^0-9.]/g, '')) : null,
              customSpecs: { notes: data.customSpecsNotes || '', pincode: data.pincode || '' },
            }
          ]
        }
      }
    });

    revalidatePath('/account');
    return { success: true, id: rfq.id, rfqNumber };
  } catch (error: any) {
    console.error('[submitQuickInquiryAction] Error:', error);
    return { success: false, error: error.message };
  }
}
