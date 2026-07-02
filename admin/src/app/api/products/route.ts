import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { syncProductToShiprocket } from '@/lib/shiprocket';

function generateSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { variants, specs, images, spaceIds, ...productData } = body;

    // Validate SKU uniqueness
    if (!productData.sku) {
      return NextResponse.json({ error: "Product SKU is required." }, { status: 400 });
    }

    const existingProductBySku = await prisma.product.findUnique({
      where: { sku: productData.sku }
    });
    if (existingProductBySku) {
      return NextResponse.json({ error: `Product SKU "${productData.sku}" is already in use by another product.` }, { status: 400 });
    }

    const existingVariantWithProductSku = await prisma.productVariant.findUnique({
      where: { sku: productData.sku }
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
      where: { sku: { in: variantSkus } }
    });
    if (conflictingProductByVariantSku) {
      return NextResponse.json({ error: `Variant SKU "${conflictingProductByVariantSku.sku}" is already in use by another product.` }, { status: 400 });
    }

    const conflictingVariant = await prisma.productVariant.findFirst({
      where: { sku: { in: variantSkus } }
    });
    if (conflictingVariant) {
      return NextResponse.json({ error: `Variant SKU "${conflictingVariant.sku}" is already in use by another product variant.` }, { status: 400 });
    }

    let slug = generateSlug(productData.name);
    // Ensure slug uniqueness
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now()}`;

    const product = await prisma.product.create({
      data: {
        ...productData,
        slug,
        dimensionUnit: body.dimensionUnit || 'INCH',
        description: productData.description || '',
        images: images || [],
        specs: specs && Object.keys(specs).length > 0 ? specs : undefined,
        spaces: spaceIds?.length > 0 
          ? { connect: spaceIds.map((id: string) => ({ id })) }
          : undefined,
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
              }))
            }
          : undefined,
      },
    });

    // Sync with Shiprocket
    try {
      const fullProduct = await prisma.product.findUnique({
        where: { id: product.id },
        include: { variants: true }
      });
      if (fullProduct) {
        await syncProductToShiprocket(fullProduct);
      }
    } catch (syncError) {
      console.error('Shiprocket Sync Error:', syncError);
      // We don't fail the whole request if sync fails, but we log it
    }
    
    return NextResponse.json(product);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
