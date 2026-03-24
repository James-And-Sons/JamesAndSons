import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ProductFormClient from '../../ProductFormClient';

export default async function EditProductPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id: params.id },
      include: { variants: true }
    }),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
  ]);

  if (!product) return notFound();

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex justify-between items-center bg-surface p-6 border border-border">
        <div>
          <h1 className="font-serif text-[28px] font-light text-primary tracking-wide m-0">Edit Product</h1>
          <p className="font-mono text-[11px] text-muted mt-1 uppercase tracking-widest">{product.sku}</p>
        </div>
        <Link href="/products" className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted border border-border px-6 py-2.5 hover:text-primary transition-colors">
          Cancel
        </Link>
      </div>
      <div className="bg-surface border border-border p-8">
        <ProductFormClient categories={categories} defaultValues={product} mode="edit" />
      </div>
    </div>
  );
}
