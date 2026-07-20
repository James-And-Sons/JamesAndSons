import { prisma } from './prisma';
import { Product } from './utils';
import { unstable_cache } from 'next/cache';

async function getProductsRaw(filter?: string): Promise<Product[]> {
  try {
    const dbProducts = await prisma.product.findMany({
      include: {
        category: true,
        spaces: true
      }
    });

    const products = dbProducts.map(p => ({
      ...p,
      collection: p.category?.name || 'Uncategorized',
      longDescription: p.description,
      finishes: ['Gold', 'Silver'], 
      spaces: p.spaces.map(s => s.name),
      specs: (p.specs as any) || [],
      images: p.images,
    })) as Product[];

    if (!filter || filter === 'All') return products;
    
    const f = filter.toLowerCase();
    return products.filter(p =>
      p.collection.toLowerCase().includes(f) ||
      p.spaces.some(s => s.toLowerCase().includes(f)) ||
      (f === 'led certified' && p.isLed) ||
      (f === 'modern' && p.collection.toLowerCase().includes('modern')) ||
      (f === 'classical' && p.collection.toLowerCase().includes('heritage'))
    );
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
}

export const getProducts = (filter?: string) => unstable_cache(
  async () => getProductsRaw(filter),
  ['products-list-v3', filter || 'all'],
  { revalidate: 10, tags: ['products'] }
)();

async function getProductBySlugRaw(slug: string): Promise<Product | undefined> {
  try {
    const p = await prisma.product.findUnique({
      where: { slug },
      include: { category: true, spaces: true, variants: true }
    });
    
    if (!p) return undefined;
    
    return {
      ...p,
      collection: p.category?.name || 'Uncategorized',
      longDescription: p.description,
      finishes: ['Gold', 'Silver'],
      spaces: p.spaces.map(s => s.name),
      specs: (p.specs as any) || [],
      images: p.images,
    } as Product;
  } catch (error) {
    console.error(`Error fetching product with slug ${slug}:`, error);
    throw error;
  }
}

export const getProductBySlug = (slug: string) => unstable_cache(
  async () => getProductBySlugRaw(slug),
  ['product-detail-v3', slug],
  { revalidate: 10, tags: ['products'] }
)();

async function getSpacesRaw() {
  try {
    const spaces = await prisma.space.findMany({
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    return spaces;
  } catch (error) {
    console.error('Error fetching spaces:', error);
    throw error;
  }
}

export const getSpaces = unstable_cache(
  async () => getSpacesRaw(),
  ['spaces-list-v3'],
  { revalidate: 10, tags: ['spaces'] }
);

