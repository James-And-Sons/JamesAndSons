import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { orchestrateSync } from '@/lib/sync/orchestrator';
import { deleteFromAmazon } from '@/lib/sync/amazon';

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

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    const target = searchParams.get('target') || 'both'; // 'amazon' | 'platform' | 'both'

    if (!productId) {
      return NextResponse.json({ error: 'Missing productId parameter' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { variants: true }
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const logs: string[] = [];

    // 1. Delete from Amazon Listings Items API
    if (target === 'amazon' || target === 'both') {
      try {
        console.log(`[Manual Delete] Deleting SKU ${product.sku} and variants from Amazon...`);
        // Delete child variants first
        if (product.variants && product.variants.length > 0) {
          for (const v of product.variants) {
            try {
              await deleteFromAmazon(v.sku);
              logs.push(`Successfully deleted variant SKU ${v.sku} from Amazon.`);
            } catch (err: any) {
              console.error(`[Manual Delete] Failed to delete variant SKU ${v.sku} from Amazon:`, err);
              logs.push(`Failed to delete variant SKU ${v.sku} from Amazon: ${err.message}`);
            }
          }
        }
        // Delete parent SKU
        try {
          await deleteFromAmazon(product.sku);
          logs.push(`Successfully deleted parent SKU ${product.sku} from Amazon.`);
        } catch (err: any) {
          console.error(`[Manual Delete] Failed to delete parent SKU ${product.sku} from Amazon:`, err);
          logs.push(`Failed to delete parent SKU ${product.sku} from Amazon: ${err.message}`);
        }
      } catch (err: any) {
        console.error('[Manual Delete] Error triggering Amazon deletion:', err);
        logs.push(`Amazon deletion error: ${err.message}`);
      }
    }

    // 2. Delete from local database (platform)
    if (target === 'platform' || target === 'both') {
      try {
        // Delete all variants first
        await prisma.productVariant.deleteMany({
          where: { productId }
        });
        // Delete main product
        await prisma.product.delete({
          where: { id: productId }
        });
        logs.push(`Successfully deleted product ${product.sku} from website platform database.`);
      } catch (err: any) {
        console.error('[Manual Delete] Local database deletion error:', err);
        if (err.code === 'P2003' || err.message?.includes('Foreign key constraint')) {
          return NextResponse.json({
            error: `This product cannot be deleted because it is associated with existing Orders or RFQs. You can set its stock to 0 or archive it instead.`,
            logs
          }, { status: 400 });
        }
        return NextResponse.json({ error: `Database deletion failed: ${err.message}`, logs }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Deletion request completed.`,
      logs
    });
  } catch (error: any) {
    console.error('[Manual Delete] Error executing deletion:', error);
    return NextResponse.json({ error: error.message || 'Internal deletion error' }, { status: 500 });
  }
}
