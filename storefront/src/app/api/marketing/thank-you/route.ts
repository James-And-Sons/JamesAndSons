import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // Find orders delivered 2 days ago
    const twoDaysAgoStart = new Date();
    twoDaysAgoStart.setDate(twoDaysAgoStart.getDate() - 2);
    twoDaysAgoStart.setHours(0,0,0,0);
    
    const twoDaysAgoEnd = new Date(twoDaysAgoStart);
    twoDaysAgoEnd.setHours(23,59,59,999);

    const orders = await prisma.order.findMany({
      where: {
        status: 'DELIVERED',
        updatedAt: { gte: twoDaysAgoStart, lte: twoDaysAgoEnd }
      },
      include: { user: true }
    });

    for (const order of orders) {
      await resend.emails.send({
        from: 'James & Sons <concierge@jamesandsons.in>',
        to: [order.user.email],
        subject: 'Excellence Delivered: Your Experience with James & Sons',
        html: `
          <div style="font-family: serif; max-width: 600px; margin: 0 auto; padding: 40px; color: #1a1a1a;">
            <h1 style="font-weight: 300; font-size: 28px; color: #C4A05A;">How was your experience?</h1>
            <p>Dear ${order.user.firstName},</p>
            <p>It has been two days since your James & Sons masterpieces arrived. We hope they have brought an air of excellence to your space.</p>
            <p>We would be honored to hear your thoughts. As a token of our appreciation, please use the code <strong>LOYALTY10</strong> for 10% off your next selection.</p>
            <br />
            <a href="https://jamesandsons.in/collections" style="display: inline-block; background: #1a1a1a; color: #fff; padding: 14px 28px; text-decoration: none; text-transform: uppercase; letter-spacing: 0.1em; font-size: 12px;">Browse New Collections</a>
            <p style="margin-top: 40px; font-size: 12px; color: #999;">Warm regards,<br />The James & Sons Concierge Team</p>
          </div>
        `
      });
    }

    return NextResponse.json({ success: true, processed: orders.length });
  } catch (error: any) {
    console.error('Post-Purchase Cron Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
