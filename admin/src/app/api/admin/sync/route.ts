import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { orchestrateSync } from '@/lib/sync/orchestrator';

export const maxDuration = 60; // Allow it to run for up to 60 seconds if bulk syncing

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { productId } = body;

    if (productId) {
      console.log(`[Manual Sync] Triggering sync for single product ID: ${productId}`);
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: { variants: true, category: true, spaces: true }
      });

      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }

      await orchestrateSync(product);
      return NextResponse.json({
        success: true,
        message: `Sync completed successfully for product ${product.sku}.`
      });
    } else {
      console.log('[Manual Sync] Triggering bulk sync for all products...');
      const products = await prisma.product.findMany({
        include: { variants: true, category: true, spaces: true }
      });

      console.log(`[Manual Sync] Found ${products.length} products. Syncing...`);
      const resultsSummary = [];

      for (const product of products) {
        try {
          await orchestrateSync(product);
          resultsSummary.push({ sku: product.sku, status: 'PROCESSED' });
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (syncErr: any) {
          console.error(`[Manual Sync] Failed to sync SKU ${product.sku}:`, syncErr);
          resultsSummary.push({ sku: product.sku, status: 'FAILED', error: syncErr.message });
        }
      }

      return NextResponse.json({
        success: true,
        message: `Bulk sync completed for ${products.length} products.`,
        summary: resultsSummary
      });
    }
  } catch (error: any) {
    console.error('[Manual Sync] Error performing manual sync:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
