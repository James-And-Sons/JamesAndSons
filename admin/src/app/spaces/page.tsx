import { prisma } from '@/lib/prisma';
import SpaceManager from './SpacesManager';

export const dynamic = 'force-dynamic';

export default async function SpacesPage() {
  const spaces = await prisma.space.findMany({
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
          <h1 className="font-serif text-[28px] font-light text-primary tracking-wide m-0">Spaces</h1>
          <p className="font-mono text-[9px] uppercase tracking-widest text-muted mt-2">{spaces.length} spaces discovered</p>
        </div>
      </div>
      <SpaceManager spaces={spaces as any} allProducts={allProducts} />
    </div>
  );
}
