import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import CategoryManager from './CollectionsManager';

export const dynamic = 'force-dynamic';

export default async function CollectionsPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: { 
      _count: { select: { products: true } },
      products: { select: { id: true, name: true, images: true } }
    }
  });

  const allProducts = await prisma.product.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, sku: true, images: true }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center premium-card p-6">
        <div>
          <h1 className="font-serif text-[28px] font-light text-primary tracking-wide m-0">Categories</h1>
          <p className="font-mono text-[9px] uppercase tracking-widest text-muted mt-2">{categories.length} categories</p>
        </div>
      </div>
      <CategoryManager categories={categories as any} allProducts={allProducts} />
    </div>
  );
}
