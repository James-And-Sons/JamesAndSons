import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

function logInboundSale(sku: string, quantity: number, channel: string, status: 'SUCCESS' | 'FAILED', error?: string) {
  const newEntry = {
    timestamp: new Date().toISOString(),
    sku,
    quantity,
    channel: `${channel} (Inbound Sale)`,
    status,
    error: error || null
  };

  // Always output to console for serverless environment streams (like Vercel logs)
  console.log(`[Inbound Sale Log] ${JSON.stringify(newEntry)}`);

  try {
    const logPath = path.join(process.cwd(), 'inventory-sync-history.json');
    let history = [];
    if (fs.existsSync(logPath)) {
      const fileContent = fs.readFileSync(logPath, 'utf8');
      try {
        history = JSON.parse(fileContent);
      } catch {
        history = [];
      }
    }
    history.push(newEntry);
    if (history.length > 1000) {
      history = history.slice(-1000);
    }
    fs.writeFileSync(logPath, JSON.stringify(history, null, 2), 'utf8');
  } catch (err: any) {
    if (err.code === 'EROFS') {
      console.log(`[Inbound Webhook] Running in read-only serverless environment. File logging to ${err.path} skipped.`);
    } else {
      console.error('[Inbound Webhook] Failed to write inventory log:', err);
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Authorize the request
    const authHeader = req.headers.get('authorization');
    const token = authHeader ? authHeader.split(' ')[1] : req.nextUrl.searchParams.get('secret');
    const secret = process.env.INVENTORY_SYNC_WEBHOOK_SECRET;

    if (secret && token !== secret) {
      console.warn('[Inbound Webhook] Unauthorized order sync request.');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { sku, quantity, channel } = body;

    if (!sku || typeof quantity !== 'number' || quantity <= 0) {
      return NextResponse.json({ error: 'Invalid sku or quantity in payload' }, { status: 400 });
    }

    const channelName = channel || 'External Marketplace';
    console.log(`[Inbound Webhook] Processing sale from ${channelName} for SKU ${sku} (Qty: ${quantity})...`);

    // 2. Locate product or variant
    let updatedProductStock = 0;
    let targetSku = sku;

    // Check if variant exists
    const variant = await prisma.productVariant.findUnique({
      where: { sku: targetSku },
      include: { product: true }
    });

    if (variant) {
      // Calculate new stock (defensive lte 0 limit)
      const newVarStock = Math.max(0, variant.stockQuantity - quantity);
      const newProdStock = Math.max(0, variant.product.stockQuantity - quantity);

      await prisma.$transaction([
        prisma.productVariant.update({
          where: { id: variant.id },
          data: { stockQuantity: newVarStock }
        }),
        prisma.product.update({
          where: { id: variant.productId },
          data: { stockQuantity: newProdStock }
        })
      ]);

      updatedProductStock = newProdStock;
      console.log(`[Inbound Webhook] Variant SKU ${targetSku} stock updated: ${variant.stockQuantity} -> ${newVarStock}`);
      logInboundSale(targetSku, quantity, channelName, 'SUCCESS');
    } else {
      // Check if product exists
      const product = await prisma.product.findUnique({
        where: { sku: targetSku }
      });

      if (!product) {
        console.warn(`[Inbound Webhook] SKU ${targetSku} not found in database.`);
        logInboundSale(targetSku, quantity, channelName, 'FAILED', 'SKU not found');
        return NextResponse.json({ error: `SKU ${targetSku} not found` }, { status: 404 });
      }

      const newProdStock = Math.max(0, product.stockQuantity - quantity);
      await prisma.product.update({
        where: { id: product.id },
        data: { stockQuantity: newProdStock }
      });

      updatedProductStock = newProdStock;
      console.log(`[Inbound Webhook] Product SKU ${targetSku} stock updated: ${product.stockQuantity} -> ${newProdStock}`);
      logInboundSale(targetSku, quantity, channelName, 'SUCCESS');
    }

    return NextResponse.json({
      success: true,
      message: 'Inventory decremented successfully',
      sku: targetSku,
      newQuantity: updatedProductStock
    });
  } catch (error: any) {
    console.error('[Inbound Webhook] Error processing webhook:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
