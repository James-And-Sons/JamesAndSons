import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sku, imageUrl } = await request.json();

    if (!sku || !imageUrl) {
      return NextResponse.json({ error: 'SKU and image URL are required' }, { status: 400 });
    }

    // Find the product by SKU
    const product = await prisma.product.findUnique({
      where: { sku }
    });

    if (!product) {
      return NextResponse.json({ error: `Product with SKU ${sku} not found` }, { status: 404 });
    }

    // Append image to images list (avoiding duplicate image URLs)
    const existingImages = product.images || [];
    if (!existingImages.includes(imageUrl)) {
      await prisma.product.update({
        where: { id: product.id },
        data: {
          images: {
            set: [...existingImages, imageUrl]
          }
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Import SKU image error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
