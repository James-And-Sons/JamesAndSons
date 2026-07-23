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

async function getCategoriesRaw() {
  try {
    const cats = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    return cats;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

export const getCategories = unstable_cache(
  async () => getCategoriesRaw(),
  ['categories-list-v1'],
  { revalidate: 60, tags: ['categories'] }
);

async function getNewArrivalsRaw(limit = 8): Promise<Product[]> {
  try {
    const dbProducts = await prisma.product.findMany({
      include: { category: true, spaces: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return dbProducts.map(p => ({
      ...p,
      collection: p.category?.name || 'Uncategorized',
      longDescription: p.description,
      finishes: ['Gold', 'Silver'],
      spaces: p.spaces.map(s => s.name),
      specs: (p.specs as any) || [],
      images: p.images,
    })) as Product[];
  } catch (error) {
    console.error('Error fetching new arrivals:', error);
    return [];
  }
}

export const getNewArrivals = (limit = 8) => unstable_cache(
  async () => getNewArrivalsRaw(limit),
  ['new-arrivals-v1', String(limit)],
  { revalidate: 60, tags: ['products'] }
)();

async function getBestSellersRaw(limit = 6): Promise<Product[]> {
  try {
    // Group orderItems by productId and count, then join product details
    const topProductIds = await prisma.orderItem.groupBy({
      by: ['productId'],
      _count: { productId: true },
      orderBy: { _count: { productId: 'desc' } },
      take: limit,
    });

    if (topProductIds.length === 0) {
      // Fallback: return featured or latest products
      return getNewArrivalsRaw(limit);
    }

    const ids = topProductIds.map(t => t.productId);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: ids } },
      include: { category: true, spaces: true },
    });

    // Sort to match ranking order
    const sorted = ids.map(id => dbProducts.find(p => p.id === id)).filter(Boolean) as typeof dbProducts;

    return sorted.map(p => ({
      ...p,
      collection: p.category?.name || 'Uncategorized',
      longDescription: p.description,
      finishes: ['Gold', 'Silver'],
      spaces: p.spaces.map(s => s.name),
      specs: (p.specs as any) || [],
      images: p.images,
    })) as Product[];
  } catch (error) {
    console.error('Error fetching best sellers:', error);
    return getNewArrivalsRaw(limit);
  }
}

export const getBestSellers = (limit = 6) => unstable_cache(
  async () => getBestSellersRaw(limit),
  ['best-sellers-v1', String(limit)],
  { revalidate: 120, tags: ['products', 'orders'] }
)();
