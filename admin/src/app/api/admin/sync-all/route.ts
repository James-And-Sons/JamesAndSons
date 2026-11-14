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

    console.log(`[Bulk Sync] Found ${products.length} products. Starting sequential sync execution...`);
    
    const resultsSummary: any[] = [];
    for (const product of products) {
      try {
        await orchestrateSync(product);
        resultsSummary.push({ sku: product.sku, status: 'PROCESSED' });
        // Small delay between products to respect potential rate limits on external APIs
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (syncErr: any) {
        console.error(`[Bulk Sync] Failed to sync product ${product.sku}:`, syncErr);
        resultsSummary.push({ sku: product.sku, status: 'FAILED', error: syncErr.message });
      }
    }

    console.log('[Bulk Sync] Completed bulk sync sequence.');

    return NextResponse.json({
      success: true,
      message: `Sync completed for ${products.length} products.`,
      summary: resultsSummary
    });
  } catch (error: any) {
    console.error('[Bulk Sync] Error executing bulk sync:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
