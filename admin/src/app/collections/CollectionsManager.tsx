'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { addProductToCollection, removeProductFromCollection } from './actions';

type Category = { 
  id: string; 
  name: string; 
  slug: string; 
  description: string | null; 
  _count: { products: number };
  products: { id: string; name: string }[];
};

export default function CollectionsManager({ categories, allProducts }: { categories: Category[], allProducts: { id: string, name: string, sku: string }[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [managingProducts, setManagingProducts] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');

  const openAdd = () => { setEditing(null); setName(''); setDescription(''); setShowForm(true); setManagingProducts(null); };
  const openEdit = (cat: Category) => { setEditing(cat); setName(cat.name); setDescription(cat.description || ''); setShowForm(true); setManagingProducts(null); };
  const openManage = (cat: Category) => { setManagingProducts(cat); setShowForm(false); setEditing(null); };

  const handleSave = () => {
    if (!name.trim()) { setError('Name is required'); return; }
    startTransition(async () => {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const method = editing ? 'PUT' : 'POST';
      const url = editing ? `/api/collections/${editing.id}` : '/api/collections';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug, description }),
      });
      if (!res.ok) { setError(await res.text()); return; }
      setShowForm(false);
      router.refresh();
    });
  };

  const handleDelete = (id: string, productCount: number) => {
    if (productCount > 0) { alert(`Cannot delete: ${productCount} product(s) use this collection.`); return; }
    if (!confirm('Delete this collection?')) return;
    startTransition(async () => {
      await fetch(`/api/collections/${id}`, { method: 'DELETE' });
      router.refresh();
    });
  };

  const handleAddProduct = async () => {
    if (!managingProducts || !selectedProductId) return;
    const res = await addProductToCollection(managingProducts.id, selectedProductId);
    if (res.success) {
      setSelectedProductId('');
      router.refresh();
      // Update local state to reflect change immediately if possible, or just wait for refresh
      const updatedCat = categories.find(c => c.id === managingProducts.id);
      if (updatedCat) setManagingProducts(updatedCat);
    }
  };

  const handleRemoveProduct = async (productId: string) => {
    if (!managingProducts) return;
    const res = await removeProductFromCollection(managingProducts.id, productId);
    if (res.success) {
      router.refresh();
      const updatedCat = categories.find(c => c.id === managingProducts.id);
      if (updatedCat) setManagingProducts(updatedCat);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-3">
        <button onClick={openAdd} className="btn-primary font-mono text-[10px] uppercase tracking-[0.12em] px-6 py-3">
          + New Collection
        </button>
      </div>

      {showForm && (
        <div className="bg-surface border border-accent/30 p-6 space-y-4">
          <h3 className="font-serif text-[20px] text-primary">{editing ? 'Edit Collection' : 'New Collection'}</h3>
          {error && <p className="text-red-400 font-mono text-[11px]">{error}</p>}
          <div>
            <label className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted block mb-1">Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-background border border-border px-4 py-3 text-[14px] text-primary focus:outline-none focus:border-accent" />
          </div>
          <div>
            <label className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted block mb-1">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full bg-background border border-border px-4 py-3 text-[14px] text-primary focus:outline-none focus:border-accent resize-none" />
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowForm(false)} className="font-mono text-[9px] uppercase tracking-widest text-muted border border-border px-5 py-2">Cancel</button>
            <button onClick={handleSave} disabled={isPending} className="btn-primary font-mono text-[9px] uppercase tracking-widest px-5 py-2 disabled:opacity-50">
              {isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {managingProducts && (
        <div className="bg-surface border border-accent/30 p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-serif text-[22px] text-primary">Manage Products: <span className="text-accent">{managingProducts.name}</span></h3>
            <button onClick={() => setManagingProducts(null)} className="font-mono text-[10px] uppercase tracking-widest text-muted">Close</button>
          </div>

          <div className="space-y-4">
            <div className="flex gap-3 items-end bg-background/50 p-4 border border-border">
              <div className="flex-1">
                <label className="font-mono text-[9px] uppercase tracking-widest text-muted block mb-1">Add Product to Collection</label>
                <select 
                  value={selectedProductId} 
                  onChange={e => setSelectedProductId(e.target.value)}
                  className="w-full bg-background border border-border px-4 py-2 text-[13px] text-primary focus:outline-none"
                >
                  <option value="">Select a product...</option>
                  {allProducts
                    .filter(p => !categories.find(c => c.id === managingProducts.id)?.products.some(cp => cp.id === p.id))
                    .map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                    ))
                  }
                </select>
              </div>
              <button 
                onClick={handleAddProduct}
                disabled={!selectedProductId}
                className="btn-primary px-6 py-2.5 text-[10px] uppercase tracking-widest disabled:opacity-50"
              >
                Add
              </button>
            </div>

            <div className="border border-border">
              <table className="w-full text-left">
                <thead className="bg-[#16161a] border-b border-border">
                  <tr>
                    <th className="px-4 py-3 font-mono text-[9px] uppercase tracking-widest text-muted">Product Name</th>
                    <th className="px-4 py-3 font-mono text-[9px] uppercase tracking-widest text-muted text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {categories.find(c => c.id === managingProducts.id)?.products.map(p => (
                    <tr key={p.id} className="hover:bg-background/30">
                      <td className="px-4 py-3 font-body text-[13px] text-primary">{p.name}</td>
                      <td className="px-4 py-3 text-right">
                        <button 
                          onClick={() => handleRemoveProduct(p.id)}
                          className="font-mono text-[9px] uppercase text-red-400/70 hover:text-red-400"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(!categories.find(c => c.id === managingProducts.id)?.products.length) && (
                    <tr><td colSpan={2} className="px-4 py-8 text-center font-mono text-[10px] text-muted uppercase tracking-widest">No products in this collection</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="bg-surface border border-border overflow-hidden">
        <table className="w-full text-left">
          <thead className="border-b border-border">
            <tr>
              <th className="px-6 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">Collection Name</th>
              <th className="px-6 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">Slug</th>
              <th className="px-6 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">Products</th>
              <th className="px-6 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(cat => (
              <tr key={cat.id} className="border-b border-border hover:bg-surface-muted">
                <td className="px-6 py-4 font-serif text-[17px] text-primary">{cat.name}</td>
                <td className="px-6 py-4 font-mono text-[11px] text-muted">{cat.slug}</td>
                <td className="px-6 py-4 font-mono text-[13px] text-secondary">{cat._count.products}</td>
                <td className="px-6 py-4 text-right flex gap-4 justify-end">
                  <button onClick={() => openManage(cat)} className="font-mono text-[9px] uppercase tracking-[0.1em] text-accent hover:text-white transition-colors">Products</button>
                  <button onClick={() => openEdit(cat)} className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted hover:text-white transition-colors">Edit</button>
                  <button onClick={() => handleDelete(cat.id, cat._count.products)} className="font-mono text-[9px] uppercase tracking-[0.1em] text-red-400/60 hover:text-red-400 transition-colors">Delete</button>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-12 text-center font-mono text-[11px] text-muted uppercase tracking-widest">No collections yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
