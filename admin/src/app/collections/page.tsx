import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import CollectionsManager from './CollectionsManager';

export const dynamic = 'force-dynamic';

export default async function CollectionsPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: { 
      _count: { select: { products: true } },
      products: { select: { id: true, name: true } }
    }
  });

  const allProducts = await prisma.product.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, sku: true }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-surface p-6 border border-border">
        <div>
          <h1 className="font-serif text-[28px] font-light text-primary tracking-wide m-0">Collections</h1>
          <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted mt-2">{categories.length} collections</p>
        </div>
      </div>
      <CollectionsManager categories={categories as any} allProducts={allProducts} />
    </div>
  );
}
