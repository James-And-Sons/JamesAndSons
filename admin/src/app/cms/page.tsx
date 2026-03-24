import { prisma } from '@/lib/prisma';
import CMSControls from './CMSControls';

export const dynamic = 'force-dynamic';

export default async function CMSPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, slug: true, sku: true, images: true }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-surface p-6 border border-border">
        <div>
          <h1 className="font-serif text-[28px] font-light text-primary tracking-wide m-0">CMS Workspace</h1>
          <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted mt-2">
            Manage homepage banners & featured collections
          </p>
        </div>
      </div>

      <CMSControls categories={categories} products={products} />
    </div>
  );
}
