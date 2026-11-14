import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import EditSpaceClient from './EditSpaceClient';

export const dynamic = 'force-dynamic';

export default async function EditSpacePage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;

  const [space, allProducts] = await Promise.all([
    prisma.space.findUnique({
      where: { id: params.id },
      include: {
        products: {
          select: { id: true, name: true, sku: true, images: true },
          orderBy: { name: 'asc' }
        }
      }
    }),
    prisma.product.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, sku: true, images: true }
    })
  ]);

  if (!space) return notFound();

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <EditSpaceClient space={space} allProducts={allProducts} />
    </div>
  );
}
