import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { orchestrateSync } from '@/lib/sync/orchestrator';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader ? authHeader.split(' ')[1] : req.nextUrl.searchParams.get('secret');
    const secret = process.env.INVENTORY_SYNC_WEBHOOK_SECRET;

    if (secret && token !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Bulk Sync] Querying all products from database...');
    const products = await prisma.product.findMany({
      include: { variants: true }
    });

    console.log(`[Bulk Sync] Found ${products.length} products. Dispatched sync orchestrator for all items...`);
    
    // We execute them in the background so the HTTP request returns immediately
    (async () => {
      for (const product of products) {
        try {
          await orchestrateSync(product);
          // Small delay between products to respect potential rate limits on external APIs
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (syncErr) {
          console.error(`[Bulk Sync] Failed to sync product ${product.sku}:`, syncErr);
        }
      }
      console.log('[Bulk Sync] Completed bulk sync sequence.');
    })();

    return NextResponse.json({
      success: true,
      message: `Sync initiated in the background for ${products.length} existing products.`
    });
  } catch (error: any) {
    console.error('[Bulk Sync] Error executing bulk sync:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
