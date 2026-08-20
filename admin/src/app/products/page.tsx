import { prisma } from '../../lib/prisma';
import ProductsTableClient from './ProductsTableClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      include: {
        category: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    }),
    prisma.category.findMany({
      orderBy: { name: 'asc' },
    }),
  ]);

  return (
    <ProductsTableClient
      products={products as any}
      categories={categories as any}
    />
  );
}
