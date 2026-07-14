import { prisma } from '../../lib/prisma';
import Link from 'next/link';
import SearchInput from '@/components/SearchInput';
import SelectFilter from '@/components/SelectFilter';
import ClickableRow from '@/components/ClickableRow';
import SyncButton from '@/components/SyncButton';

export const dynamic = 'force-dynamic';

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;
  const q = typeof params.q === 'string' ? params.q : undefined;
  const categoryId = typeof params.categoryId === 'string' ? params.categoryId : undefined;
  const status = typeof params.status === 'string' ? params.status : undefined;

  const where: any = {};
  
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' as const } },
      { sku: { contains: q, mode: 'insensitive' as const } }
    ];
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (status === 'out_of_stock') {
    where.stockQuantity = { lte: 0 };
  } else if (status === 'active') {
    where.stockQuantity = { gt: 0 };
  }

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
    where,
    include: {
      category: true,
    },
    orderBy: {
      createdAt: 'desc',
    }
  }),
    prisma.category.findMany({
      orderBy: { name: 'asc' }
    })
  ]);

  const categoryOptions = categories.map(c => ({ label: c.name, value: c.id }));
  const statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Out of Stock', value: 'out_of_stock' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-surface p-6 border border-border">
        <h1 className="font-serif text-[28px] font-light text-primary tracking-wide m-0">Catalog &amp; Pricing</h1>
        <div className="flex gap-4">
          <div className="relative group flex items-center z-20">
            <button className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted border border-border px-6 py-2.5 hover:bg-surface-muted hover:text-primary transition-colors bg-background flex items-center gap-1 cursor-pointer">
              Export Feeds ▾
            </button>
            <div className="absolute right-0 top-full mt-1 hidden group-hover:block bg-background border border-border py-2 w-48 shadow-lg">
              <a href="/api/admin/export/pinterest" download="pinterest_feed.csv" className="block px-4 py-2 text-[10px] font-mono uppercase tracking-wider text-muted hover:bg-surface-muted hover:text-primary transition-colors">Pinterest Feed</a>
              <a href="/api/admin/export/meta" download="meta_feed.csv" className="block px-4 py-2 text-[10px] font-mono uppercase tracking-wider text-muted hover:bg-surface-muted hover:text-primary border-t border-border/30 transition-colors">Meta Feed</a>
              <a href="/api/admin/export/amazon" download="amazon_listing_feed.xlsm" className="block px-4 py-2 text-[10px] font-mono uppercase tracking-wider text-muted hover:bg-surface-muted hover:text-primary border-t border-border/30 transition-colors">Amazon Feed</a>
              <a href="/api/admin/export/flipkart" download="flipkart_feed.csv" className="block px-4 py-2 text-[10px] font-mono uppercase tracking-wider text-muted hover:bg-surface-muted hover:text-primary border-t border-border/30 transition-colors">Flipkart Feed</a>
              <a href="/api/admin/export/indiamart" download="indiamart_catalog.csv" className="block px-4 py-2 text-[10px] font-mono uppercase tracking-wider text-muted hover:bg-surface-muted hover:text-primary border-t border-border/30 transition-colors">IndiaMART Feed</a>
            </div>
          </div>
          <SyncButton />
          <Link href="/products/import" className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted border border-border px-6 py-2.5 hover:bg-surface-muted hover:text-primary transition-colors bg-background flex items-center">Import CSV</Link>
          <Link href="/products/add" className="btn-primary flex items-center">Add Product</Link>
        </div>
      </div>

      <div className="bg-surface border border-border shadow-sm flex flex-col">
        <div className="p-6 border-b border-border flex gap-4 bg-surface-muted/30">
          <SearchInput placeholder="Search by Product Name or SKU..." />
          <SelectFilter 
            paramName="categoryId" 
            placeholder="All Categories" 
            options={categoryOptions} 
          />
          <SelectFilter 
            paramName="status" 
            placeholder="Status: All" 
            options={statusOptions} 
          />
        </div>

        <div className="flex-1 table-responsive">
          <table className="w-full text-left">
            <thead className="bg-background/50 border-b border-border">
              <tr>
                <th className="px-8 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">Product</th>
                <th className="px-8 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">SKU</th>
                <th className="px-8 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">D2C Price (MRP)</th>
                <th className="px-8 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">B2B Base Price</th>
                <th className="px-8 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">Stock</th>
                <th className="px-8 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">Status</th>
                <th className="px-8 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {products.map((product: any) => {
                const isOutOfStock = product.stockQuantity <= 0;
                
                return (
                  <ClickableRow key={product.id} href={`/products/${product.id}/edit`}>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-12 bg-background border border-border flex items-center justify-center font-mono text-[8px] text-muted tracking-widest text-center opacity-70">
                          {product.images && product.images.length > 0 ? (
                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            'IMG'
                          )}
                        </div>
                        <div>
                          <div className="font-body text-[14px] text-primary">{product.name}</div>
                          <div className="font-mono text-[10px] text-muted mt-1 tracking-wider uppercase">
                            {product.category?.name || 'Uncategorized'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 font-mono text-[12px] text-primary">{product.sku}</td>
                    <td className="px-8 py-5 font-serif text-[18px] text-primary">₹{product.d2cPrice.toLocaleString('en-IN')}</td>
                    <td className="px-8 py-5 font-serif text-[18px] text-[#4ade80]">₹{product.b2bPrice.toLocaleString('en-IN')}</td>
                    <td className={`px-8 py-5 font-mono text-[13px] ${isOutOfStock ? 'text-[#ef4444]' : 'text-primary'}`}>
                      {product.stockQuantity}
                    </td>
                    <td className="px-8 py-5">
                      {isOutOfStock ? (
                        <span className="font-mono text-[9px] uppercase tracking-wider text-[#ef4444] border border-[#ef4444]/30 px-2 py-1 bg-[#ef4444]/10">Out of Stock</span>
                      ) : (
                        <span className="font-mono text-[9px] uppercase tracking-wider text-[#4ade80] border border-[#4ade80]/30 px-2 py-1 bg-[#4ade80]/10">Active</span>
                      )}
                    </td>
                    <td className="px-8 py-5 text-right flex justify-end gap-3 items-center">
                      <SyncButton productId={product.id} label="Sync" className="btn-ghost text-gold hover:text-gold-hover hover:bg-gold/10 px-3 py-1.5 font-mono text-[9px] uppercase tracking-wider border border-gold/30 cursor-pointer disabled:opacity-50 flex items-center" />
                      <Link prefetch={false} href={`/products/${product.id}/edit`} className="btn-ghost">Edit</Link>
                    </td>
                  </ClickableRow>
                );
              })}
              
              {products.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-8 py-8 text-center text-muted font-mono text-[10px] uppercase tracking-widest">
                    No products found in the database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-6 border-t border-border flex justify-between items-center bg-background/50">
          <span className="font-mono text-[10px] tracking-wider text-muted">Showing 1 to {products.length} of {products.length} entries</span>
          <div className="flex gap-2">
            <button className="px-4 py-2 border border-border text-[9px] font-mono tracking-widest uppercase text-muted bg-background disabled:opacity-50" disabled>Prev</button>
            <button className="px-4 py-2 border border-border text-[9px] font-mono tracking-widest uppercase text-muted bg-background disabled:opacity-50" disabled>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
