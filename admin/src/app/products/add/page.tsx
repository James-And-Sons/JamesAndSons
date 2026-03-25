import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import ProductFormClient from '../ProductFormClient';

export const dynamic = 'force-dynamic';

export default async function AddProductPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex justify-between items-center bg-surface p-6 border border-border">
        <h1 className="font-serif text-[28px] font-light text-primary tracking-wide m-0">Add New Product</h1>
        <Link href="/products" className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted border border-border px-6 py-2.5 hover:bg-surface hover:text-primary transition-colors">
          Cancel
        </Link>
      </div>
      <div className="bg-surface border border-border p-8">
        <ProductFormClient categories={categories} mode="add" />
      </div>
    </div>
  );
}
