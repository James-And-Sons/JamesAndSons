import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import ProductFormClient from '../../ProductFormClient';

export const dynamic = 'force-dynamic';

export default async function EditProductPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const [product, categories, spaces] = await Promise.all([
    prisma.product.findUnique({
      where: { id: params.id },
      include: { variants: true, spaces: { select: { id: true } } }
    }),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
    prisma.space.findMany({ orderBy: { name: 'asc' } }),
  ]);

  if (!product) return notFound();

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="bg-surface border border-border p-8">
        <ProductFormClient categories={categories} spaces={spaces} defaultValues={product} mode="edit" />
      </div>
    </div>
  );
}
