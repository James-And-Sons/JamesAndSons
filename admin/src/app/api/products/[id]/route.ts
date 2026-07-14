import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { syncProductToShiprocket } from '@/lib/shiprocket';

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const body = await req.json();
    const { id, variants, specs, images, spaceIds, ...productData } = body;

    // Validate SKU uniqueness
    if (!productData.sku) {
      return NextResponse.json({ error: "Product SKU is required." }, { status: 400 });
    }

    const existingProductBySku = await prisma.product.findFirst({
      where: {
        sku: productData.sku,
        id: { not: params.id }
      }
    });
    if (existingProductBySku) {
      return NextResponse.json({ error: `Product SKU "${productData.sku}" is already in use by another product.` }, { status: 400 });
    }

    const existingVariantWithProductSku = await prisma.productVariant.findFirst({
      where: {
        sku: productData.sku,
        productId: { not: params.id }
      }
    });
    if (existingVariantWithProductSku) {
      return NextResponse.json({ error: `Product SKU "${productData.sku}" is already in use by a product variant.` }, { status: 400 });
    }

    const variantSkus = variants?.map((v: any) => v.sku?.trim()).filter(Boolean) || [];
    const uniqueVariantSkus = new Set(variantSkus);
    if (uniqueVariantSkus.size !== variantSkus.length) {
      return NextResponse.json({ error: "Duplicate SKUs found within the variants list." }, { status: 400 });
    }

    if (variantSkus.includes(productData.sku)) {
      return NextResponse.json({ error: `A variant cannot have the same SKU ("${productData.sku}") as the main product.` }, { status: 400 });
    }

    const conflictingProductByVariantSku = await prisma.product.findFirst({
      where: {
        sku: { in: variantSkus },
        id: { not: params.id }
      }
    });
    if (conflictingProductByVariantSku) {
      return NextResponse.json({ error: `Variant SKU "${conflictingProductByVariantSku.sku}" is already in use by another product.` }, { status: 400 });
    }

    const conflictingVariant = await prisma.productVariant.findFirst({
      where: {
        sku: { in: variantSkus },
        productId: { not: params.id }
      }
    });
    if (conflictingVariant) {
      return NextResponse.json({ error: `Variant SKU "${conflictingVariant.sku}" is already in use by another product variant.` }, { status: 400 });
    }

    // Delete old variants and recreate
    await prisma.productVariant.deleteMany({ where: { productId: params.id } });

    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        ...productData,
        dimensionUnit: body.dimensionUnit || 'INCH',
        images: images || [],
        specs: specs && Object.keys(specs).length > 0 ? specs : undefined,
        spaces: {
          set: spaceIds?.map((id: string) => ({ id })) || []
        },
        updatedAt: new Date(),
        variants: variants?.length > 0
          ? {
              create: variants.map((v: any) => ({
                name: v.name,
                sku: v.sku,
                dimensionUnit: body.dimensionUnit || 'INCH',
                d2cPrice: v.d2cPrice || null,
                mrp: v.mrp || null,
                b2bPrice: v.b2bPrice || null,
                stockQuantity: v.stockQuantity || 0,
                images: v.images || [],
                weight: v.weight || null,
                length: v.length || null,
                breadth: v.breadth || null,
                height: v.height || null,
                actualHeight: v.actualHeight || null,
                actualWidth: v.actualWidth || null,
                actualDepth: v.actualDepth || null,
                power: v.power || null,
                voltage: v.voltage || null,
                googleProductCategory: v.googleProductCategory || null,
                color: v.color || null,
                size: v.size || null,
                material: v.material || null,
                countryOfOrigin: v.countryOfOrigin || null,
                brand: v.brand || null,
                warranty: v.warranty || null,
                bulletPoints: v.bulletPoints || [],
                materialAndFinish: v.materialAndFinish || [],
                bulbType: v.bulbType || [],
                style: v.style || [],
                specs: v.specs && Object.keys(v.specs).length > 0 ? v.specs : undefined,
              }))
            }
          : undefined,
      },
    });

    // Sync with Shiprocket
    try {
      const fullProduct = await prisma.product.findUnique({
        where: { id: params.id },
        include: { variants: true }
      });
      if (fullProduct) {
        await syncProductToShiprocket(fullProduct);
      }
    } catch (syncError) {
      console.error('Shiprocket Sync Error:', syncError);
    }

    // Omnichannel integration sync (Amazon, Meta, Pinterest, Flipkart, Pepperfry)
    try {
      const { orchestrateSync } = await import('@/lib/sync/orchestrator');
      const fullProduct = await prisma.product.findUnique({
        where: { id: params.id },
        include: { variants: true, category: true, spaces: true }
      });
      if (fullProduct) {
        orchestrateSync(fullProduct).catch(err => {
          console.error('[Sync Orchestrator] Background sync failed:', err);
        });
      }
    } catch (syncError) {
      console.error('Sync Orchestration Import/Trigger Error:', syncError);
    }

    return NextResponse.json(product);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    await prisma.product.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
