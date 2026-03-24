'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Category = { id: string; name: string };

type Variant = { name: string; sku: string; d2cPrice: string; mrp: string; stockQuantity: string; images: string };
type Spec = { key: string; value: string };

export default function ProductFormClient({ categories, defaultValues, mode }: {
  categories: Category[];
  defaultValues?: any;
  mode: 'add' | 'edit';
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Images
  const [images, setImages] = useState<string[]>(defaultValues?.images || ['']);
  const addImage = () => setImages(prev => [...prev, '']);
  const updateImage = (i: number, val: string) => setImages(prev => prev.map((img, idx) => idx === i ? val : img));
  const removeImage = (i: number) => setImages(prev => prev.filter((_, idx) => idx !== i));

  // Variants
  const [variants, setVariants] = useState<Variant[]>(
    defaultValues?.variants?.map((v: any) => ({
      name: v.name || '',
      sku: v.sku || '',
      d2cPrice: String(v.d2cPrice || ''),
      mrp: String(v.mrp || ''),
      stockQuantity: String(v.stockQuantity || '0'),
      images: (v.images || []).join(', '),
    })) || []
  );
  const addVariant = () => setVariants(prev => [...prev, { name: '', sku: '', d2cPrice: '', mrp: '', stockQuantity: '0', images: '' }]);
  const updateVariant = (i: number, field: keyof Variant, val: string) => setVariants(prev => prev.map((v, idx) => idx === i ? { ...v, [field]: val } : v));
  const removeVariant = (i: number) => setVariants(prev => prev.filter((_, idx) => idx !== i));

  // Specs
  const [specs, setSpecs] = useState<Spec[]>(
    defaultValues?.specs ? Object.entries(defaultValues.specs).map(([key, value]) => ({ key, value: String(value) })) : []
  );
  const addSpec = () => setSpecs(prev => [...prev, { key: '', value: '' }]);
  const updateSpec = (i: number, field: 'key' | 'value', val: string) => setSpecs(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s));
  const removeSpec = (i: number) => setSpecs(prev => prev.filter((_, idx) => idx !== i));

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const fd = new FormData(e.currentTarget);

    const body = {
      id: defaultValues?.id,
      name: fd.get('name'),
      sku: fd.get('sku'),
      description: fd.get('description'),
      mrp: parseFloat(fd.get('mrp') as string),
      d2cPrice: parseFloat(fd.get('d2cPrice') as string),
      b2bPrice: parseFloat(fd.get('b2bPrice') as string),
      stockQuantity: parseInt(fd.get('stockQuantity') as string, 10) || 0,
      categoryId: fd.get('categoryId'),
      isLed: fd.get('isLed') === 'on',
      gstRate: parseFloat(fd.get('gstRate') as string) || 18,
      hsnCode: fd.get('hsnCode'),
      bisCertification: fd.get('bisCertification'),
      images: images.filter(img => img.trim()),
      variants: variants.map(v => ({
        name: v.name,
        sku: v.sku,
        d2cPrice: v.d2cPrice ? parseFloat(v.d2cPrice) : null,
        mrp: v.mrp ? parseFloat(v.mrp) : null,
        stockQuantity: parseInt(v.stockQuantity, 10) || 0,
        images: v.images ? v.images.split(',').map(s => s.trim()).filter(Boolean) : [],
      })),
      specs: specs.reduce((acc: any, s) => { if (s.key) acc[s.key] = s.value; return acc; }, {}),
    };

    try {
      const url = mode === 'add' ? '/api/products' : `/api/products/${defaultValues.id}`;
      const method = mode === 'add' ? 'POST' : 'PUT';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error(await res.text());
      router.push('/products');
      router.refresh();
    } catch (e: any) {
      setError(e.message || 'Failed to save product');
      setSaving(false);
    }
  }

  const inputCls = "w-full bg-background border border-border px-4 py-3 text-[14px] font-body text-primary focus:outline-none focus:border-accent transition-colors";
  const labelCls = "font-mono text-[10px] uppercase tracking-[0.15em] text-muted block mb-1";
  const sectionTitle = "font-serif text-[20px] text-primary mb-4";

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {error && (
        <div className="p-4 border border-red-900 bg-red-900/10 text-red-400 font-mono text-[12px]">{error}</div>
      )}

      {/* === BASIC INFO === */}
      <div>
        <h3 className={sectionTitle}>Basic Information</h3>
        <div className="grid grid-cols-2 gap-6">
          <div><label className={labelCls}>Product Name *</label><input required name="name" defaultValue={defaultValues?.name} className={inputCls} /></div>
          <div><label className={labelCls}>SKU Code *</label><input required name="sku" defaultValue={defaultValues?.sku} className={`${inputCls} uppercase`} /></div>
          <div className="col-span-2"><label className={labelCls}>Description</label><textarea name="description" rows={4} defaultValue={defaultValues?.description} className={inputCls} /></div>
          <div>
            <label className={labelCls}>Category *</label>
            <select required name="categoryId" defaultValue={defaultValues?.categoryId || ''} className={inputCls}>
              <option value="">Select Category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* === PRICING & INVENTORY === */}
      <div className="pt-6 border-t border-border">
        <h3 className={sectionTitle}>Pricing & Inventory</h3>
        <div className="grid grid-cols-4 gap-6">
          <div><label className={labelCls}>MRP (₹) *</label><input required type="number" step="0.01" name="mrp" defaultValue={defaultValues?.mrp} className={inputCls} /></div>
          <div><label className={labelCls}>D2C Price (₹) *</label><input required type="number" step="0.01" name="d2cPrice" defaultValue={defaultValues?.d2cPrice} className={inputCls} /></div>
          <div><label className={labelCls}>B2B Price (₹) *</label><input required type="number" step="0.01" name="b2bPrice" defaultValue={defaultValues?.b2bPrice} className={inputCls} /></div>
          <div><label className={labelCls}>Stock Qty</label><input type="number" name="stockQuantity" defaultValue={defaultValues?.stockQuantity || 0} className={inputCls} /></div>
        </div>
      </div>

      {/* === TECHNICAL SPECS === */}
      <div className="pt-6 border-t border-border">
        <h3 className={sectionTitle}>Technical Specifications</h3>
        <div className="grid grid-cols-4 gap-6 mb-6">
          <div>
            <label className={labelCls}>GST Rate (%)</label>
            <select name="gstRate" defaultValue={defaultValues?.gstRate || 18} className={inputCls}>
              <option value={5}>5% (LED)</option>
              <option value={18}>18% (Traditional)</option>
            </select>
          </div>
          <div><label className={labelCls}>HSN Code</label><input name="hsnCode" defaultValue={defaultValues?.hsnCode} className={inputCls} placeholder="e.g. 94054090" /></div>
          <div><label className={labelCls}>BIS Certification</label><input name="bisCertification" defaultValue={defaultValues?.bisCertification} className={inputCls} placeholder="IS 10322" /></div>
          <div className="flex items-center gap-3 mt-6">
            <input type="checkbox" name="isLed" id="isLed" defaultChecked={defaultValues?.isLed} className="w-4 h-4 accent-[#c4a05a]" />
            <label htmlFor="isLed" className="font-mono text-[11px] uppercase tracking-widest text-muted cursor-pointer">LED Product</label>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className={labelCls}>Additional Specs (for filtering)</label>
            <button type="button" onClick={addSpec} className="font-mono text-[9px] uppercase tracking-[0.15em] text-accent border border-accent/30 px-3 py-1 hover:border-accent transition-colors">
              + Add Spec
            </button>
          </div>
          {specs.map((spec, i) => (
            <div key={i} className="flex gap-3 items-center">
              <input value={spec.key} onChange={e => updateSpec(i, 'key', e.target.value)} placeholder="Key (e.g. Material)" className={`${inputCls} w-1/3`} />
              <input value={spec.value} onChange={e => updateSpec(i, 'value', e.target.value)} placeholder="Value (e.g. Brass)" className={`${inputCls} flex-1`} />
              <button type="button" onClick={() => removeSpec(i)} className="text-red-400/60 hover:text-red-400 font-mono text-[16px] px-2 flex-shrink-0">×</button>
            </div>
          ))}
          {specs.length === 0 && <p className="text-muted font-mono text-[11px]">No specs yet — click "Add Spec" to add filterable attributes like Material, Finish, Diameter, etc.</p>}
        </div>
      </div>

      {/* === IMAGES === */}
      <div className="pt-6 border-t border-border">
        <h3 className={sectionTitle}>Product Images</h3>
        <div className="space-y-2">
          {images.map((img, i) => (
            <div key={i} className="flex gap-3 items-center">
              <span className="font-mono text-[10px] text-muted w-16 flex-shrink-0">Image {i + 1}</span>
              <input value={img} onChange={e => updateImage(i, e.target.value)} placeholder="https://..." className={`${inputCls} flex-1`} />
              {images.length > 1 && (
                <button type="button" onClick={() => removeImage(i)} className="text-red-400/60 hover:text-red-400 font-mono text-[16px] px-2 flex-shrink-0">×</button>
              )}
            </div>
          ))}
          <button type="button" onClick={addImage} className="font-mono text-[9px] uppercase tracking-[0.15em] text-accent border border-accent/30 px-4 py-2 hover:border-accent transition-colors mt-2">
            + Add Another Image
          </button>
        </div>
      </div>

      {/* === VARIANTS === */}
      <div className="pt-6 border-t border-border">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className={sectionTitle}>Product Variants</h3>
            <p className="font-body text-[13px] text-muted -mt-2">Define finish/size variations. Leave empty if no variants.</p>
          </div>
          <button type="button" onClick={addVariant} className="font-mono text-[9px] uppercase tracking-[0.15em] text-accent border border-accent/30 px-4 py-2 hover:border-accent transition-colors">
            + Add Variant
          </button>
        </div>
        {variants.length === 0 ? (
          <div className="bg-background border border-dashed border-border p-6 text-center">
            <p className="font-mono text-[11px] text-muted uppercase tracking-widest">No variants — click "Add Variant" to create size or finish options</p>
          </div>
        ) : (
          <div className="space-y-4">
            {variants.map((v, i) => (
              <div key={i} className="bg-background border border-border p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-accent">Variant {i + 1}</span>
                  <button type="button" onClick={() => removeVariant(i)} className="text-red-400/60 hover:text-red-400 font-mono text-[12px]">Remove</button>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div><label className={labelCls}>Variant Name *</label><input required value={v.name} onChange={e => updateVariant(i, 'name', e.target.value)} placeholder='e.g. "Gold – 48 inch"' className={inputCls} /></div>
                  <div><label className={labelCls}>SKU *</label><input required value={v.sku} onChange={e => updateVariant(i, 'sku', e.target.value)} className={inputCls} /></div>
                  <div><label className={labelCls}>Stock Qty</label><input type="number" value={v.stockQuantity} onChange={e => updateVariant(i, 'stockQuantity', e.target.value)} className={inputCls} /></div>
                  <div><label className={labelCls}>D2C Price Override (₹)</label><input type="number" step="0.01" value={v.d2cPrice} onChange={e => updateVariant(i, 'd2cPrice', e.target.value)} placeholder="Leave blank to inherit" className={inputCls} /></div>
                  <div><label className={labelCls}>MRP Override (₹)</label><input type="number" step="0.01" value={v.mrp} onChange={e => updateVariant(i, 'mrp', e.target.value)} placeholder="Leave blank to inherit" className={inputCls} /></div>
                  <div><label className={labelCls}>Image URLs (comma separated)</label><input value={v.images} onChange={e => updateVariant(i, 'images', e.target.value)} placeholder="https://img1.jpg, https://img2.jpg" className={inputCls} /></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* === SUBMIT === */}
      <div className="pt-6 border-t border-border flex justify-end gap-4">
        <button type="button" onClick={() => router.back()} className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted border border-border px-6 py-3 hover:text-primary transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
          {saving ? 'Saving...' : mode === 'add' ? 'Save Product' : 'Update Product'}
        </button>
      </div>
    </form>
  );
}
