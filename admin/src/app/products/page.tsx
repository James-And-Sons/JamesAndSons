import { prisma } from '../../lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    include: {
      category: true,
    },
    orderBy: {
      createdAt: 'desc',
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-surface p-6 border border-border">
        <h1 className="font-serif text-[28px] font-light text-primary tracking-wide m-0">Catalog &amp; Pricing</h1>
        <div className="flex gap-4">
          <button className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted border border-border px-6 py-2.5 hover:bg-surface-muted hover:text-primary transition-colors bg-background">Import CSV</button>
          <Link href="/products/add" className="btn-primary flex items-center">Add Product</Link>
        </div>
      </div>

      <div className="bg-surface border border-border shadow-sm flex flex-col">
        <div className="p-6 border-b border-border flex gap-4 bg-surface-muted/30">
          <input 
            type="text" 
            placeholder="Search by Product Name or SKU..." 
            className="w-1/3 px-4 py-2 border border-border bg-background text-primary font-body text-[13px] focus:outline-none focus:border-accent transition-colors placeholder:text-muted/50"
          />
          <select className="px-4 py-2 border border-border bg-background text-secondary font-mono text-[10px] uppercase tracking-[0.1em] focus:outline-none focus:border-accent transition-colors">
            <option>All Categories</option>
            <option>Modern Series</option>
            <option>Heritage Collection</option>
            <option>Commercial Spaces</option>
          </select>
          <select className="px-4 py-2 border border-border bg-background text-secondary font-mono text-[10px] uppercase tracking-[0.1em] focus:outline-none focus:border-accent transition-colors">
            <option>Status: All</option>
            <option>Active</option>
            <option>Draft</option>
            <option>Out of Stock</option>
          </select>
        </div>

        <div className="flex-1 overflow-x-auto">
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
                  <tr key={product.id} className="hover:bg-surface-muted transition-colors">
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
                    <td className="px-8 py-5 text-right">
                      <Link href={`/products/${product.id}/edit`} className="font-mono text-[10px] uppercase tracking-[0.15em] text-accent hover:text-accent-hover transition-colors">Edit</Link>
                    </td>
                  </tr>
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
