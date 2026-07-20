import { prisma } from '@/lib/prisma';
import ProductFormClient from '../ProductFormClient';

export const dynamic = 'force-dynamic';

export default async function AddProductPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  const spaces = await prisma.space.findMany({ orderBy: { name: 'asc' } });

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <ProductFormClient categories={categories} spaces={spaces} mode="add" />
    </div>
  );
}
