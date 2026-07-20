import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { orchestrateSync } from '@/lib/sync/orchestrator';

export async function POST(req: NextRequest) {
  try {
    // 1. Authorize the request
    const authHeader = req.headers.get('authorization');
    const token = authHeader ? authHeader.split(' ')[1] : req.nextUrl.searchParams.get('secret');
    const secret = process.env.INVENTORY_SYNC_WEBHOOK_SECRET;

    if (secret && token !== secret) {
      console.warn('[Supabase Webhook] Unauthorized sync request.');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    console.log('[Supabase Webhook] Received payload:', JSON.stringify(payload, null, 2));

    const { type, table, record } = payload;

    if (!record) {
      console.warn('[Supabase Webhook] No record found in payload. Skipping.');
      return NextResponse.json({ success: true, message: 'No record in payload' });
    }

    // 2. Fetch full product representation based on insert/update target table
    let productId = null;
    if (table === 'Product') {
      productId = record.id;
    } else if (table === 'ProductVariant') {
      productId = record.productId;
    }

    if (!productId) {
      console.warn(`[Supabase Webhook] Ignored table trigger: ${table}`);
      return NextResponse.json({ success: true, message: `Ignored table: ${table}` });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { variants: true }
    });

    if (!product) {
      console.warn(`[Supabase Webhook] Product not found for ID: ${productId}`);
      return NextResponse.json({ success: true, message: 'Product not found in DB' });
    }

    // 3. Await the orchestration to prevent serverless freezing
    await orchestrateSync(product);

    return NextResponse.json({ success: true, message: 'Sync completed successfully' });
  } catch (error: any) {
    console.error('[Supabase Webhook] Error processing webhook:', error);
    return NextResponse.json({ error: error.message || 'Internal webhook error' }, { status: 500 });
  }
}
