'use client';
import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { addProductToCollection, removeProductFromCollection } from './actions';
import { useSidebar } from '@/lib/context/SidebarContext';
import CloudinaryUpload from '@/components/CloudinaryUpload';

type Category = { 
  id: string; 
  name: string; 
  slug: string; 
  description: string | null; 
  technicalSubheading: string | null;
  hsnCode: string | null;
  gstRate: number | null;
  bisStandard: string | null;
  bisStatus: string | null;
  image: string | null;
  images: string[];
  _count: { products: number };
  products: { id: string; name: string; images: string[] }[];
};

export default function CategoryManager({ categories, allProducts }: { categories: Category[], allProducts: { id: string, name: string, sku: string, images: string[] }[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [managingProducts, setManagingProducts] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [technicalSubheading, setTechnicalSubheading] = useState('');
  const [hsnCode, setHsnCode] = useState('');
  const [gstRate, setGstRate] = useState<number>(18);
  const [bisStandard, setBisStandard] = useState('');
  const [bisStatus, setBisStatus] = useState('Pending Application');
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');

  const { setIsPageDirty } = useSidebar();

  const isDirty = showForm && (
    editing === null 
      ? (name !== '' || description !== '' || technicalSubheading !== '' || hsnCode !== '' || gstRate !== 18 || bisStandard !== '' || bisStatus !== '' || images.length > 0)
      : (name !== editing.name || 
         description !== (editing.description || '') ||
         technicalSubheading !== (editing.technicalSubheading || '') ||
         hsnCode !== (editing.hsnCode || '') ||
         gstRate !== (editing.gstRate !== null && editing.gstRate !== undefined ? editing.gstRate : 18) ||
         bisStandard !== (editing.bisStandard || '') ||
         bisStatus !== (editing.bisStatus || '') ||
         JSON.stringify(images) !== JSON.stringify(editing.images || []))
  );

  useEffect(() => {
    setIsPageDirty(isDirty);
    return () => setIsPageDirty(false);
  }, [isDirty, setIsPageDirty]);

  const handleDiscard = () => {
    if (isDirty) {
      if (!confirm('You have unsaved changes. Discard them?')) return;
    }
    setShowForm(false);
    setError('');
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const manageId = params.get('manage');
      const editId = params.get('edit');
      
      if (manageId) {
        const cat = categories.find(c => c.id === manageId);
        if (cat) {
          setManagingProducts(cat);
          setShowForm(false);
          setEditing(null);
        }
      } else if (editId) {
        const cat = categories.find(c => c.id === editId);
        if (cat) {
          setEditing(cat);
          setName(cat.name);
          setDescription(cat.description || '');
          setTechnicalSubheading(cat.technicalSubheading || '');
          setHsnCode(cat.hsnCode || '');
          setGstRate(cat.gstRate !== null && cat.gstRate !== undefined ? cat.gstRate : 18);
          setBisStandard(cat.bisStandard || '');
          setBisStatus(cat.bisStatus || '');
          setImages(cat.images || []);
          setShowForm(true);
          setManagingProducts(null);
        }
      }
    }
  }, [categories]);

  const openAdd = () => { 
    setEditing(null); 
    setName(''); 
    setDescription(''); 
    setTechnicalSubheading('');
    setHsnCode('');
    setGstRate(18);
    setBisStandard('');
    setBisStatus('Pending Application');
    setImages([]);
    setShowForm(true); 
    setManagingProducts(null); 
  };
  
  const openEdit = (cat: Category) => { 
    setEditing(cat); 
    setName(cat.name); 
    setDescription(cat.description || ''); 
    setTechnicalSubheading(cat.technicalSubheading || '');
    setHsnCode(cat.hsnCode || '');
    setGstRate(cat.gstRate !== null && cat.gstRate !== undefined ? cat.gstRate : 18);
    setBisStandard(cat.bisStandard || '');
    setBisStatus(cat.bisStatus || '');
    setImages(cat.images || []);
    setShowForm(true); 
    setManagingProducts(null); 
  };

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
        body: JSON.stringify({ 
          name, 
          slug, 
          description,
          technicalSubheading,
          hsnCode,
          gstRate: parseFloat(String(gstRate)) || 18,
          bisStandard,
          bisStatus,
          image: images[0] || null,
          images
        }),
      });
      if (!res.ok) { setError(await res.text()); return; }
      setShowForm(false);
      router.refresh();
    });
  };

  const handleDelete = (id: string, productCount: number) => {
    if (productCount > 0) { alert(`Cannot delete: ${productCount} product(s) use this category.`); return; }
    if (!confirm('Delete this category?')) return;
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
        <button onClick={openAdd} className="btn-primary font-mono text-[10px] uppercase tracking-[0.12em] px-8 py-3 shadow-lg shadow-accent/20">
          + Create New Category
        </button>
      </div>

      {showForm && (
        <div className="premium-card p-8 space-y-6 shadow-[0_8px_32px_rgba(0,0,0,0.25)] border-accent/40 bg-surface/90 backdrop-blur">
          <h3 className="font-serif text-[22px] text-primary font-light">{editing ? 'Edit Category' : 'Create New Category'}</h3>
          {error && <p className="text-red-400 font-mono text-[11px]">{error}</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block mb-1">Category Name *</label>
              <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-background border border-border px-4 py-3 text-[13px] font-body text-primary focus:outline-none focus:border-accent transition-colors" placeholder="e.g. Chandeliers" />
            </div>
            <div className="space-y-1">
              <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block mb-1">Technical Subheading</label>
              <input value={technicalSubheading} onChange={e => setTechnicalSubheading(e.target.value)} className="w-full bg-background border border-border px-4 py-3 text-[13px] font-body text-primary focus:outline-none focus:border-accent transition-colors" placeholder="e.g. Chandelier / Pendant (LED)" />
            </div>
            <div className="space-y-1">
              <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block mb-1">8-Digit HSN Code</label>
              <input value={hsnCode} onChange={e => setHsnCode(e.target.value)} className="w-full bg-background border border-border px-4 py-3 text-[13px] font-body text-primary focus:outline-none focus:border-accent transition-colors" placeholder="e.g. 94051100" />
            </div>
            <div className="space-y-1">
              <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block mb-1">GST Rate (%)</label>
              <select value={gstRate} onChange={e => setGstRate(parseFloat(e.target.value))} className="w-full bg-background border border-border px-4 py-3 text-[13px] font-body text-primary focus:outline-none focus:border-accent transition-colors cursor-pointer">
                <option value={5}>5%</option>
                <option value={12}>12%</option>
                <option value={18}>18%</option>
                <option value={28}>28%</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block mb-1">Applicable BIS Standard</label>
              <input value={bisStandard} onChange={e => setBisStandard(e.target.value)} className="w-full bg-background border border-border px-4 py-3 text-[13px] font-body text-primary focus:outline-none focus:border-accent transition-colors" placeholder="e.g. IS 10322 (Part 5 / Sec 1)" />
            </div>
            <div className="space-y-1">
              <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block mb-1">BIS Status</label>
              <select value={bisStatus} onChange={e => setBisStatus(e.target.value)} className="w-full bg-background border border-border px-4 py-3 text-[13px] font-body text-primary focus:outline-none focus:border-accent transition-colors cursor-pointer">
                <option value="Pending Application">Pending Application</option>
                <option value="Approved">Approved</option>
                <option value="Not Available">Not Available</option>
              </select>
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block mb-1">Description (Optional)</label>
              <input value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-background border border-border px-4 py-3 text-[13px] font-body text-primary focus:outline-none focus:border-accent transition-colors" placeholder="Brief summary of this category" />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted block mb-2">Category Cover Photos (Multiple)</label>
              <CloudinaryUpload 
                onUpload={(urls) => setImages(urls)}
                defaultImages={images}
                multiple={true}
                label="Add Category Cover Photo"
              />
            </div>
          </div>
          <div className="flex gap-4 justify-end pt-4 border-t border-border/40">
            <button onClick={handleDiscard} className="font-mono text-[9px] uppercase tracking-widest text-muted border border-border px-6 py-2.5 hover:text-primary hover:bg-surface-muted/30 transition-colors bg-background">Discard</button>
            <button onClick={handleSave} disabled={isPending} className="px-6 py-2.5 font-mono text-[9px] uppercase tracking-widest bg-accent text-black hover:bg-accent-hover transition-colors font-bold disabled:opacity-50">
              {isPending ? 'Processing...' : 'Save Category'}
            </button>
          </div>
        </div>
      )}

      {managingProducts && (
        <div className="premium-card p-8 space-y-6 shadow-xl border-accent/30 bg-surface/90 backdrop-blur">
          <div className="flex justify-between items-center border-b border-border/40 pb-4">
            <h3 className="font-serif text-[22px] text-primary font-light">Products in <span className="text-accent underline underline-offset-8">{managingProducts.name}</span></h3>
            <button onClick={() => setManagingProducts(null)} className="font-mono text-[9px] uppercase tracking-widest text-muted hover:text-primary border border-border px-4 py-2 hover:bg-surface-muted transition-colors">Close Manager</button>
          </div>

          <div className="space-y-4">
            <div className="flex gap-3 items-end bg-background/50 p-4 border border-border">
              <div className="flex-1">
                <label className="font-mono text-[10px] uppercase tracking-widest text-muted block mb-1">Add Product to Category</label>
                <select 
                  value={selectedProductId} 
                  onChange={e => setSelectedProductId(e.target.value)}
                  className="w-full bg-background border border-border px-4 py-3 text-[14px] font-body text-primary focus:outline-none focus:border-accent cursor-pointer"
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
                className="px-6 py-2.5 font-mono text-[9px] uppercase tracking-widest bg-accent text-black hover:bg-accent-hover transition-colors font-bold disabled:opacity-50"
              >
                Add
              </button>
            </div>

            <div className="premium-card overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-[#16161a] border-b border-border">
                  <tr>
                    <th className="px-6 py-3.5 font-mono text-[9px] uppercase tracking-widest text-muted">Product Name</th>
                    <th className="px-6 py-3.5 font-mono text-[9px] uppercase tracking-widest text-muted text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {categories.find(c => c.id === managingProducts.id)?.products.map(p => (
                    <tr key={p.id} className="hover:bg-background/30 transition-colors">
                      <td className="px-6 py-4 font-body text-[13px] text-primary">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-background border border-border flex items-center justify-center font-mono text-[7px] text-muted overflow-hidden">
                            {p.images && p.images.length > 0 ? (
                              <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              'IMG'
                            )}
                          </div>
                          {p.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleRemoveProduct(p.id)}
                          className="font-mono text-[9px] uppercase text-rose-400 hover:text-rose-500 transition-colors"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(!categories.find(c => c.id === managingProducts.id)?.products.length) && (
                    <tr><td colSpan={2} className="px-6 py-8 text-center font-mono text-[10px] text-muted uppercase tracking-widest">No products in this category</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="premium-card overflow-hidden">
        <table className="w-full text-left">
          <thead className="border-b border-border bg-surface-muted/30">
            <tr>
              <th className="px-6 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">Category Name</th>
              <th className="px-6 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">Technical Subheading</th>
              <th className="px-6 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">8-Digit HSN Code</th>
              <th className="px-6 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">GST Rate</th>
              <th className="px-6 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">Applicable BIS Standard</th>
              <th className="px-6 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal">BIS Status</th>
              <th className="px-6 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal text-right">Products</th>
              <th className="px-6 py-4 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-normal text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {categories.map(cat => (
              <tr key={cat.id} className="hover:bg-surface-muted/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {cat.image ? (
                      <div className="relative w-12 h-12 border border-border overflow-hidden bg-background">
                        <img src={cat.image} alt={cat.name} className="object-cover w-full h-full" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 border border-dashed border-border/60 flex items-center justify-center text-muted font-mono text-[9px] bg-background">
                        No Img
                      </div>
                    )}
                    <div>
                      <div className="font-serif text-[17px] text-primary">{cat.name}</div>
                      <div className="font-mono text-[10px] text-muted">{cat.slug}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 font-body text-[13px] text-primary">{cat.technicalSubheading || '—'}</td>
                <td className="px-6 py-4 font-mono text-[12px] text-secondary">{cat.hsnCode || '—'}</td>
                <td className="px-6 py-4 font-mono text-[12px] text-secondary">{cat.gstRate !== null && cat.gstRate !== undefined ? `${cat.gstRate}%` : '—'}</td>
                <td className="px-6 py-4 font-body text-[13px] text-primary">{cat.bisStandard || '—'}</td>
                <td className="px-6 py-4">
                  <span className={`font-mono text-[10px] uppercase px-2 py-1 rounded-sm border ${
                    cat.bisStatus?.toLowerCase().includes('pending')
                      ? 'border-amber-500/30 text-amber-400 bg-amber-500/5'
                      : cat.bisStatus?.toLowerCase().includes('approved')
                        ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5'
                        : 'border-border text-muted bg-surface-muted/20'
                  }`}>
                    {cat.bisStatus || '—'}
                  </span>
                </td>
                <td className="px-6 py-4 font-mono text-[13px] text-right text-secondary tabular-nums">{cat._count.products}</td>
                <td className="px-6 py-4 text-right flex gap-4 justify-end">
                  <button onClick={() => openManage(cat)} className="font-mono text-[9px] uppercase tracking-[0.1em] text-accent hover:text-white transition-colors">Products</button>
                  <button onClick={() => openEdit(cat)} className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted hover:text-white transition-colors">Edit</button>
                  <button onClick={() => handleDelete(cat.id, cat._count.products)} className="font-mono text-[9px] uppercase tracking-[0.1em] text-rose-400 hover:text-rose-500 transition-colors">Delete</button>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr><td colSpan={8} className="px-6 py-12 text-center font-mono text-[11px] text-muted uppercase tracking-widest">No categories yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
