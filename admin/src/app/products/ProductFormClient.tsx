'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CloudinaryUpload from '@/components/CloudinaryUpload';
import SyncButton from '@/components/SyncButton';

type Category = { id: string; name: string };
type Space = { id: string; name: string };
type Spec = { key: string; value: string };

const GOOGLE_PRODUCT_CATEGORIES = [
  "Home & Garden > Lighting > Light Fixtures",
  "Home & Garden > Lighting > Light Fixtures > Chandeliers",
  "Home & Garden > Lighting > Light Fixtures > Ceiling Light Fixtures",
  "Home & Garden > Lighting > Light Fixtures > Wall Light Fixtures",
  "Home & Garden > Lighting > Light Fixtures > Lamps",
  "Home & Garden > Lighting > Lighting Hardware & Accessories",
  "Home & Garden > Lighting > Light Fixtures > Track Lighting",
  "Home & Garden > Lighting > Light Fixtures > Recessed Lighting"
];

type Variant = {
  id?: string;
  name: string;
  sku: string;
  d2cPrice: string;
  mrp: string;
  b2bPrice: string;
  stockQuantity: string;
  images: string;
  whiteBackgroundImages: string;
  weight: string;
  length: string;
  breadth: string;
  height: string;
  actualHeight: string;
  actualWidth: string;
  actualDepth: string;
  power: string;
  voltage: string;
  googleProductCategory: string;
  color: string;
  size: string;
  material: string;
  countryOfOrigin: string;
  brand: string;
  warranty: string;
  bulletPoints: string;
  materialAndFinish: string;
  bulbType: string;
  style: string;
  specs: Spec[];
};

export default function ProductFormClient({ categories, spaces, defaultValues, mode }: {
  categories: Category[];
  spaces: Space[];
  defaultValues?: any;
  mode: 'add' | 'edit';
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  // activeTab: 'parent' or number (index of active variant)
  const [activeTab, setActiveTab] = useState<'parent' | number>('parent');

  // Dimension Unit ('INCH' or 'CM')
  const [dimensionUnit, setDimensionUnit] = useState<'INCH' | 'CM'>(
    defaultValues?.dimensionUnit || 'INCH'
  );

  // Main Product state
  const [parentValues, setParentValues] = useState({
    name: defaultValues?.name || '',
    sku: defaultValues?.sku || '',
    description: defaultValues?.description || '',
    mrp: defaultValues?.mrp ? String(defaultValues.mrp) : '',
    d2cPrice: defaultValues?.d2cPrice ? String(defaultValues.d2cPrice) : '',
    b2bPrice: defaultValues?.b2bPrice ? String(defaultValues.b2bPrice) : '',
    stockQuantity: defaultValues?.stockQuantity ? String(defaultValues.stockQuantity) : '0',
    weight: defaultValues?.weight ? String(defaultValues.weight) : '',
    length: defaultValues?.length ? String(defaultValues.length) : '',
    breadth: defaultValues?.breadth ? String(defaultValues.breadth) : '',
    height: defaultValues?.height ? String(defaultValues.height) : '',
    actualHeight: defaultValues?.actualHeight ? String(defaultValues.actualHeight) : '',
    actualWidth: defaultValues?.actualWidth ? String(defaultValues.actualWidth) : '',
    actualDepth: defaultValues?.actualDepth ? String(defaultValues.actualDepth) : '',
    categoryId: defaultValues?.categoryId || '',
    isLed: defaultValues?.isLed || false,
    gstRate: defaultValues?.gstRate || 18,
    hsnCode: defaultValues?.hsnCode || '',
    bisCertification: defaultValues?.bisCertification || '',
    materialAndFinish: defaultValues?.materialAndFinish?.join(', ') || '',
    bulbType: defaultValues?.bulbType?.join(', ') || '',
    style: defaultValues?.style?.join(', ') || '',
    power: defaultValues?.power || '',
    voltage: defaultValues?.voltage || '',
    googleProductCategory: defaultValues?.googleProductCategory || '',
    color: defaultValues?.color || '',
    size: defaultValues?.size || '',
    material: defaultValues?.material || '',
    countryOfOrigin: defaultValues?.countryOfOrigin || 'India',
    brand: defaultValues?.brand || 'James and Sons',
    warranty: defaultValues?.warranty || '',
    bulletPoints: defaultValues?.bulletPoints?.join('\n') || '',
    amazonFixtureForm: defaultValues?.amazonFixtureForm || '',
    amazonMountingType: defaultValues?.amazonMountingType || '',
    amazonLightingMethod: defaultValues?.amazonLightingMethod || '',
    amazonWaterResistance: defaultValues?.amazonWaterResistance || '',
    amazonTheme: defaultValues?.amazonTheme || '',
    amazonSpecialFeatures: defaultValues?.amazonSpecialFeatures || [] as string[],
    amazonIncludedComponents: defaultValues?.amazonIncludedComponents || '',
    amazonKeywords: defaultValues?.amazonKeywords || '',
  });

  // Spaces (Product spaces)
  const [selectedSpaces, setSelectedSpaces] = useState<string[]>(
    defaultValues?.spaces?.map((s: any) => s.id) || []
  );

  // Images states
  const [images, setImages] = useState<string[]>(defaultValues?.images || []);
  const [whiteBackgroundImages, setWhiteBackgroundImages] = useState<string[]>(
    defaultValues?.whiteBackgroundImages || []
  );

  // Main Product Specs
  const [specs, setSpecs] = useState<Spec[]>(
    defaultValues?.specs
      ? Object.entries(defaultValues.specs).map(([key, value]) => ({ key, value: String(value) }))
      : []
  );

  // Variants state
  const [variants, setVariants] = useState<Variant[]>(
    defaultValues?.variants?.map((v: any) => ({
      id: v.id,
      name: v.name || '',
      sku: v.sku || '',
      d2cPrice: v.d2cPrice ? String(v.d2cPrice) : '',
      mrp: v.mrp ? String(v.mrp) : '',
      b2bPrice: v.b2bPrice ? String(v.b2bPrice) : '',
      stockQuantity: String(v.stockQuantity || '0'),
      images: (v.images || []).join(', '),
      whiteBackgroundImages: (v.whiteBackgroundImages || []).join(', '),
      weight: v.weight ? String(v.weight) : '',
      length: v.length ? String(v.length) : '',
      breadth: v.breadth ? String(v.breadth) : '',
      height: v.height ? String(v.height) : '',
      actualHeight: v.actualHeight ? String(v.actualHeight) : '',
      actualWidth: v.actualWidth ? String(v.actualWidth) : '',
      actualDepth: v.actualDepth ? String(v.actualDepth) : '',
      power: v.power || '',
      voltage: v.voltage || '',
      googleProductCategory: v.googleProductCategory || '',
      color: v.color || '',
      size: v.size || '',
      material: v.material || '',
      countryOfOrigin: v.countryOfOrigin || '',
      brand: v.brand || '',
      warranty: v.warranty || '',
      bulletPoints: (v.bulletPoints || []).join('\n'),
      materialAndFinish: (v.materialAndFinish || []).join(', '),
      bulbType: (v.bulbType || []).join(', '),
      style: (v.style || []).join(', '),
      specs: v.specs
        ? Object.entries(v.specs).map(([key, value]) => ({ key, value: String(value) }))
        : [],
    })) || []
  );

  // Warning check states
  const [openSections, setOpenSections] = useState({
    basic: true,
    pricing: true,
    specs: false,
    seo: false,
    images: true
  });

  // Warn if B2B Price equals MRP
  const showB2BWarning = !!(parentValues.b2bPrice && parentValues.mrp && Number(parentValues.b2bPrice) === Number(parentValues.mrp));

  // Completion dot logic helper
  const isBasicComplete = !!(parentValues.name && parentValues.sku && parentValues.categoryId);
  const isPricingComplete = !!(parentValues.mrp && parentValues.d2cPrice && parentValues.b2bPrice && parentValues.stockQuantity);
  const isSpecsComplete = !!(parentValues.power && parentValues.voltage);
  const isSeoComplete = !!(parentValues.brand);
  const isImagesComplete = images.length > 0;

  const totalSections = 5;
  const completedSections = 
    (isBasicComplete ? 1 : 0) + 
    (isPricingComplete ? 1 : 0) + 
    (isSpecsComplete ? 1 : 0) + 
    (isSeoComplete ? 1 : 0) + 
    (isImagesComplete ? 1 : 0);

  // Unsaved changes confirmation dialog
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleParentFieldChange = (field: keyof typeof parentValues, val: any) => {
    setIsDirty(true);
    setParentValues(prev => ({ ...prev, [field]: val }));
  };

  const addVariant = () => {
    setIsDirty(true);
    const nextIdx = variants.length + 1;
    const defaultSkuSuffix = `-VAR${nextIdx}`;
    const autoSku = parentValues.sku ? `${parentValues.sku}${defaultSkuSuffix}`.toUpperCase() : '';

    setVariants(prev => [...prev, {
      name: '',
      sku: autoSku,
      d2cPrice: '',
      mrp: '',
      b2bPrice: '',
      stockQuantity: '0',
      images: '',
      whiteBackgroundImages: '',
      weight: '',
      length: '',
      breadth: '',
      height: '',
      actualHeight: '',
      actualWidth: '',
      actualDepth: '',
      power: '',
      voltage: '',
      googleProductCategory: '',
      color: '',
      size: '',
      material: '',
      countryOfOrigin: '',
      brand: '',
      warranty: '',
      bulletPoints: '',
      materialAndFinish: '',
      bulbType: '',
      style: '',
      specs: []
    }]);
  };

  const updateVariantField = (idx: number, field: keyof Variant, val: any) => {
    setIsDirty(true);
    setVariants(prev => prev.map((v, i) => i === idx ? { ...v, [field]: val } : v));
  };

  const removeVariant = (idx: number) => {
    setIsDirty(true);
    setVariants(prev => prev.filter((_, i) => i !== idx));
  };

  // Variant Specs functions
  const addVariantSpec = (vIdx: number) => {
    setIsDirty(true);
    setVariants(prev => prev.map((v, i) => i === vIdx ? { ...v, specs: [...v.specs, { key: '', value: '' }] } : v));
  };

  const updateVariantSpec = (vIdx: number, sIdx: number, field: 'key' | 'value', val: string) => {
    setIsDirty(true);
    setVariants(prev => prev.map((v, i) => {
      if (i === vIdx) {
        const newSpecs = v.specs.map((s, idx) => idx === sIdx ? { ...s, [field]: val } : s);
        return { ...v, specs: newSpecs };
      }
      return v;
    }));
  };

  const removeVariantSpec = (vIdx: number, sIdx: number) => {
    setIsDirty(true);
    setVariants(prev => prev.map((v, i) => {
      if (i === vIdx) {
        const newSpecs = v.specs.filter((_, idx) => idx !== sIdx);
        return { ...v, specs: newSpecs };
      }
      return v;
    }));
  };

  // Parent specs functions
  const addSpec = () => {
    setIsDirty(true);
    setSpecs(prev => [...prev, { key: '', value: '' }]);
  };
  
  const updateSpec = (i: number, field: 'key' | 'value', val: string) => {
    setIsDirty(true);
    setSpecs(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s));
  };
  
  const removeSpec = (i: number) => {
    setIsDirty(true);
    setSpecs(prev => prev.filter((_, idx) => idx !== i));
  };

  // Image re-ordering helper
  const moveImage = (index: number, direction: 'left' | 'right', isWhiteBg: boolean) => {
    setIsDirty(true);
    const targetList = isWhiteBg ? whiteBackgroundImages : images;
    const setTargetList = isWhiteBg ? setWhiteBackgroundImages : setImages;

    if (direction === 'left' && index > 0) {
      const newList = [...targetList];
      const temp = newList[index];
      newList[index] = newList[index - 1];
      newList[index - 1] = temp;
      setTargetList(newList);
    } else if (direction === 'right' && index < targetList.length - 1) {
      const newList = [...targetList];
      const temp = newList[index];
      newList[index] = newList[index + 1];
      newList[index + 1] = temp;
      setTargetList(newList);
    }
  };

  // Variant Image re-ordering helper
  const moveVariantImage = (vIdx: number, index: number, direction: 'left' | 'right', isWhiteBg: boolean) => {
    setIsDirty(true);
    const fieldKey = isWhiteBg ? 'whiteBackgroundImages' : 'images';
    const rawVal = variants[vIdx][fieldKey] || '';
    const items = rawVal.split(',').map(s => s.trim()).filter(Boolean);

    if (direction === 'left' && index > 0) {
      const temp = items[index];
      items[index] = items[index - 1];
      items[index - 1] = temp;
      updateVariantField(vIdx, fieldKey, items.join(', '));
    } else if (direction === 'right' && index < items.length - 1) {
      const temp = items[index];
      items[index] = items[index + 1];
      items[index + 1] = temp;
      updateVariantField(vIdx, fieldKey, items.join(', '));
    }
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError('');

    if (!parentValues.sku) {
      setError('Product SKU is required.');
      setSaving(false);
      return;
    }

    const body = {
      id: defaultValues?.id,
      name: parentValues.name,
      sku: parentValues.sku,
      description: parentValues.description,
      mrp: parseFloat(parentValues.mrp) || 0,
      d2cPrice: parseFloat(parentValues.d2cPrice) || 0,
      b2bPrice: parseFloat(parentValues.b2bPrice) || 0,
      stockQuantity: parseInt(parentValues.stockQuantity, 10) || 0,
      weight: parseFloat(parentValues.weight) || 0.5,
      length: parseFloat(parentValues.length) || 10,
      breadth: parseFloat(parentValues.breadth) || 10,
      height: parseFloat(parentValues.height) || 10,
      categoryId: parentValues.categoryId,
      spaceIds: selectedSpaces,
      isLed: parentValues.isLed,
      gstRate: parseFloat(String(parentValues.gstRate)) || 18,
      hsnCode: parentValues.hsnCode,
      bisCertification: parentValues.bisCertification,
      actualHeight: parentValues.actualHeight ? parseFloat(parentValues.actualHeight) : null,
      actualWidth: parentValues.actualWidth ? parseFloat(parentValues.actualWidth) : null,
      actualDepth: parentValues.actualDepth ? parseFloat(parentValues.actualDepth) : null,
      materialAndFinish: parentValues.materialAndFinish ? parentValues.materialAndFinish.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
      bulbType: parentValues.bulbType ? parentValues.bulbType.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
      style: parentValues.style ? parentValues.style.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
      power: parentValues.power || null,
      voltage: parentValues.voltage || null,
      googleProductCategory: parentValues.googleProductCategory || null,
      color: parentValues.color || null,
      size: parentValues.size || null,
      material: parentValues.material || null,
      countryOfOrigin: parentValues.countryOfOrigin || 'India',
      brand: parentValues.brand || 'James and Sons',
      warranty: parentValues.warranty || null,
      bulletPoints: parentValues.bulletPoints ? parentValues.bulletPoints.split('\n').map((s: string) => s.trim()).filter(Boolean) : [],
      images: images.filter((img: string) => img.trim()),
      whiteBackgroundImages: whiteBackgroundImages.filter((img: string) => img.trim()),
      dimensionUnit,
      amazonFixtureForm: parentValues.amazonFixtureForm || null,
      amazonMountingType: parentValues.amazonMountingType || null,
      amazonLightingMethod: parentValues.amazonLightingMethod || null,
      amazonWaterResistance: parentValues.amazonWaterResistance || null,
      amazonTheme: parentValues.amazonTheme || null,
      amazonSpecialFeatures: parentValues.amazonSpecialFeatures || [],
      amazonIncludedComponents: parentValues.amazonIncludedComponents || null,
      amazonKeywords: parentValues.amazonKeywords || null,
      variants: variants.map(v => ({
        name: v.name,
        sku: v.sku,
        d2cPrice: v.d2cPrice ? parseFloat(v.d2cPrice) : null,
        mrp: v.mrp ? parseFloat(v.mrp) : null,
        b2bPrice: v.b2bPrice ? parseFloat(v.b2bPrice) : null,
        stockQuantity: parseInt(v.stockQuantity, 10) || 0,
        images: v.images ? v.images.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        whiteBackgroundImages: v.whiteBackgroundImages ? v.whiteBackgroundImages.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        weight: v.weight ? parseFloat(v.weight) : null,
        length: v.length ? parseFloat(v.length) : null,
        breadth: v.breadth ? parseFloat(v.breadth) : null,
        height: v.height ? parseFloat(v.height) : null,
        actualHeight: v.actualHeight ? parseFloat(v.actualHeight) : null,
        actualWidth: v.actualWidth ? parseFloat(v.actualWidth) : null,
        actualDepth: v.actualDepth ? parseFloat(v.actualDepth) : null,
        power: v.power || null,
        voltage: v.voltage || null,
        googleProductCategory: v.googleProductCategory || null,
        color: v.color || null,
        size: v.size || null,
        material: v.material || null,
        countryOfOrigin: v.countryOfOrigin || null,
        brand: v.brand || null,
        warranty: v.warranty || null,
        bulletPoints: v.bulletPoints ? v.bulletPoints.split('\n').map((s: string) => s.trim()).filter(Boolean) : [],
        materialAndFinish: v.materialAndFinish ? v.materialAndFinish.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        bulbType: v.bulbType ? v.bulbType.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        style: v.style ? v.style.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        specs: v.specs.reduce((acc: any, s: Spec) => { if (s.key) acc[s.key] = s.value; return acc; }, {}),
      })),
      specs: specs.reduce((acc: any, s: Spec) => { if (s.key) acc[s.key] = s.value; return acc; }, {}),
    };

    try {
      const url = mode === 'add' ? '/api/products' : `/api/products/${defaultValues.id}`;
      const method = mode === 'add' ? 'POST' : 'PUT';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) {
        const text = await res.text();
        try {
          const parsed = JSON.parse(text);
          throw new Error(parsed.error || text);
        } catch {
          throw new Error(text);
        }
      }
      setIsDirty(false);
      router.push('/products');
      router.refresh();
    } catch (e: any) {
      setError(e.message || 'Failed to save product');
      setSaving(false);
    }
  }

  const inputCls = "w-full bg-background border border-border px-4 py-3 text-[13px] font-body text-primary focus:outline-none focus:border-accent transition-colors";
  const labelCls = "font-mono text-[10px] uppercase tracking-[0.15em] text-muted block mb-1";


  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 border border-red-900 bg-red-900/10 text-red-400 font-mono text-[12px]">{error}</div>
      )}

      {/* === STICKY TOP BAR REDESIGN === */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border py-4 px-6 -mx-6 flex items-center justify-between gap-4">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-widest text-muted">
            Products / {parentValues.categoryId ? categories.find(c => c.id === parentValues.categoryId)?.name || 'Catalog' : 'Catalog'}
          </div>
          <div className="flex items-baseline gap-3 mt-1">
            <h1 className="font-serif text-[24px] text-primary font-light tracking-wide">
              {parentValues.name || 'New Product'}
            </h1>
            {parentValues.sku && (
              <span className="font-mono text-[10px] text-muted border border-border px-2 py-0.5 rounded-full uppercase">
                {parentValues.sku}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Dirty changes status indicator */}
          <div className={`flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider ${isDirty ? 'text-amber-500' : 'text-emerald-500'}`}>
            <span className={`w-2 h-2 rounded-full ${isDirty ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></span>
            {isDirty ? 'Unsaved Changes' : 'All Changes Saved'}
          </div>

          <div className="flex items-center gap-2.5">
            <button 
              type="button" 
              onClick={() => router.back()} 
              className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted border border-border px-5 py-2.5 hover:text-primary transition-colors bg-background"
            >
              Cancel
            </button>
            {mode === 'edit' && defaultValues?.id && (
              <SyncButton productId={defaultValues.id} label="Sync" />
            )}
            <button 
              type="submit" 
              disabled={saving} 
              className="px-5 py-2.5 font-mono text-[9px] uppercase tracking-[0.15em] bg-accent text-black hover:bg-accent-hover transition-colors font-bold disabled:opacity-50"
            >
              {saving ? 'Saving...' : mode === 'add' ? 'Save Product' : 'Update Product'}
            </button>
          </div>
        </div>
      </div>

      {/* === TWO-COLUMN RAIL LAYOUT === */}
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8 items-start">
        
        {/* === LEFT STICKY RAIL SIDE NAV === */}
        <nav className="sticky top-[86px] flex flex-col gap-6 self-start max-h-[calc(100vh-120px)] overflow-y-auto pr-2">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted mb-3">Variant View</p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('parent')}
                className={`text-left font-mono text-[11px] p-3 border transition-all rounded ${
                  activeTab === 'parent'
                    ? 'border-accent text-accent bg-accent/5 font-semibold'
                    : 'border-border text-muted hover:text-primary hover:border-accent/40 bg-background/50'
                }`}
              >
                Main Product Details
              </button>
              {variants.map((v, i) => (
                <div key={i} className="group relative flex items-center w-full">
                  <button
                    type="button"
                    onClick={() => setActiveTab(i)}
                    className={`flex-1 text-left font-mono text-[11px] p-3 border transition-all rounded-l ${
                      activeTab === i
                        ? 'border-accent border-r-transparent text-accent bg-accent/5 font-semibold'
                        : 'border-border border-r-transparent text-muted hover:text-primary hover:border-accent/40 bg-background/50'
                    }`}
                  >
                    {v.name || `Variant ${i + 1}`}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDirty(true);
                      removeVariant(i);
                      if (activeTab === i) setActiveTab('parent');
                      else if (typeof activeTab === 'number' && activeTab > i) setActiveTab(activeTab - 1);
                    }}
                    className={`px-3 py-[13px] text-[14px] border border-l-transparent text-muted hover:text-red-400 bg-background/50 hover:bg-red-950/20 transition-all rounded-r ${
                      activeTab === i ? 'border-accent' : 'border-border'
                    }`}
                    title="Delete variant"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  setIsDirty(true);
                  const newIdx = variants.length;
                  addVariant();
                  setActiveTab(newIdx);
                }}
                className="p-3 font-mono text-[11px] text-accent border border-dashed border-accent/40 hover:border-accent hover:bg-accent/5 transition-all bg-background text-center rounded"
              >
                + Add Variant Option
              </button>
            </div>
          </div>

          {activeTab === 'parent' && (
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted mb-3">
                Sections · {completedSections}/{totalSections} done
              </p>
              <ul className="border-l border-border pl-0 list-none space-y-3 font-mono text-[11px]">
                <li className="relative pl-4">
                  <span className={`absolute left-[-3.5px] top-1.5 w-1.5 h-1.5 rounded-full ${isBasicComplete ? 'bg-emerald-500' : 'bg-transparent border border-muted'}`}></span>
                  <a href="#basic" className={`${activeTab === 'parent' ? 'text-primary hover:text-accent' : 'text-muted'}`}>Basic info</a>
                </li>
                <li className="relative pl-4">
                  <span className={`absolute left-[-3.5px] top-1.5 w-1.5 h-1.5 rounded-full ${isPricingComplete ? 'bg-emerald-500' : 'bg-transparent border border-muted'}`}></span>
                  <a href="#pricing" className="text-muted hover:text-accent">Pricing & inventory</a>
                </li>
                <li className="relative pl-4">
                  <span className={`absolute left-[-3.5px] top-1.5 w-1.5 h-1.5 rounded-full ${isSpecsComplete ? 'bg-emerald-500' : 'bg-transparent border border-muted'}`}></span>
                  <a href="#specs" className="text-muted hover:text-accent">Technical specs</a>
                </li>
                <li className="relative pl-4">
                  <span className={`absolute left-[-3.5px] top-1.5 w-1.5 h-1.5 rounded-full ${isSeoComplete ? 'bg-emerald-500' : 'bg-transparent border border-muted'}`}></span>
                  <a href="#seo" className="text-muted hover:text-accent">Marketplace SEO</a>
                </li>
                <li className="relative pl-4">
                  <span className={`absolute left-[-3.5px] top-1.5 w-1.5 h-1.5 rounded-full ${isImagesComplete ? 'bg-emerald-500' : 'bg-transparent border border-muted'}`}></span>
                  <a href="#images" className="text-muted hover:text-accent">Product images</a>
                </li>
              </ul>
            </div>
          )}
        </nav>

        {/* === RIGHT FORM VIEW === */}
        <main className="min-w-0 flex-1">
          {activeTab === 'parent' ? (
            /* ========================================================================= */
            /* ========================== PARENT PRODUCT FORM ========================== */
            /* ========================================================================= */
            <div className="space-y-6">
              
              {/* === BASIC INFO CARD === */}
              <CollapsibleCard 
                id="basic" 
                title="Basic Information" 
                sub="Name, description, catalog category" 
                number="1" 
                done={isBasicComplete}
                isOpen={openSections.basic}
                onToggle={() => setOpenSections(prev => ({ ...prev, basic: !prev.basic }))}
              >
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="productName" className={labelCls}>Product Name *</label>
                    <input
                      id="productName"
                      required
                      value={parentValues.name}
                      onChange={e => handleParentFieldChange('name', e.target.value)}
                      className={inputCls}
                      placeholder="e.g. James Chandelier"
                    />
                  </div>
                  <div>
                    <label htmlFor="skuCode" className={labelCls}>SKU Code *</label>
                    <input
                      id="skuCode"
                      required
                      value={parentValues.sku}
                      onChange={e => handleParentFieldChange('sku', e.target.value)}
                      className={`${inputCls} uppercase`}
                      placeholder="e.g. JS-CHAND-102"
                    />
                  </div>
                  <div className="col-span-2">
                    <div className="flex justify-between items-baseline mb-1">
                      <label htmlFor="description" className={labelCls}>Description</label>
                      <span className="font-mono text-[9px] text-muted">{(parentValues.description || '').length} / 2000</span>
                    </div>
                    <textarea
                      id="description"
                      value={parentValues.description}
                      onChange={e => handleParentFieldChange('description', e.target.value)}
                      rows={4}
                      className={inputCls}
                      placeholder="Enter detailed catalog description..."
                    />
                  </div>
                  <div>
                    <label htmlFor="categoryId" className={labelCls}>Category *</label>
                    <select
                      id="categoryId"
                      required
                      value={parentValues.categoryId}
                      onChange={e => handleParentFieldChange('categoryId', e.target.value)}
                      className={inputCls}
                    >
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>Suited Spaces (Toggle chips)</label>
                    <div className="flex flex-wrap gap-2">
                      {spaces.map(s => {
                        const isSelected = selectedSpaces.includes(s.id);
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              setIsDirty(true);
                              setSelectedSpaces(prev => prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]);
                            }}
                            className={`px-3 py-1.5 rounded-full font-mono text-[10px] uppercase tracking-wider border transition-all ${
                              isSelected 
                                ? 'bg-accent/15 border-accent text-accent font-semibold' 
                                : 'border-border text-muted hover:border-accent/40 hover:text-primary'
                            }`}
                          >
                            {isSelected ? '✓ ' : ''}{s.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CollapsibleCard>

              {/* === PRICING & INVENTORY CARD === */}
              <CollapsibleCard
                id="pricing"
                title="Pricing & Inventory"
                sub="Channel pricing, stock, shipping dimensions"
                number="2"
                done={isPricingComplete}
                warn={showB2BWarning}
                isOpen={openSections.pricing}
                onToggle={() => setOpenSections(prev => ({ ...prev, pricing: !prev.pricing }))}
              >
                <div className="grid grid-cols-4 gap-6">
                  <div>
                    <label htmlFor="mrp" className={labelCls}>MRP (₹) *</label>
                    <div className="flex items-center">
                      <span className="bg-surface-muted border border-r-0 border-border px-3 py-3 font-mono text-[13px] text-muted">₹</span>
                      <input
                        id="mrp"
                        required
                        type="number"
                        step="0.01"
                        value={parentValues.mrp}
                        onChange={e => handleParentFieldChange('mrp', e.target.value)}
                        className={inputCls}
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="d2cPrice" className={labelCls}>D2C Price (₹) *</label>
                    <div className="flex items-center">
                      <span className="bg-surface-muted border border-r-0 border-border px-3 py-3 font-mono text-[13px] text-muted">₹</span>
                      <input
                        id="d2cPrice"
                        required
                        type="number"
                        step="0.01"
                        value={parentValues.d2cPrice}
                        onChange={e => handleParentFieldChange('d2cPrice', e.target.value)}
                        className={inputCls}
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="b2bPrice" className={labelCls}>B2B Price (₹) *</label>
                    <div className="flex items-center">
                      <span className="bg-surface-muted border border-r-0 border-border px-3 py-3 font-mono text-[13px] text-muted">₹</span>
                      <input
                        id="b2bPrice"
                        required
                        type="number"
                        step="0.01"
                        value={parentValues.b2bPrice}
                        onChange={e => handleParentFieldChange('b2bPrice', e.target.value)}
                        className={inputCls}
                      />
                    </div>
                    {showB2BWarning && (
                      <p className="text-[10px] text-amber-400 font-mono mt-1">⚠ Equal to MRP — check if intended</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="stockQuantity" className={labelCls}>Stock Qty *</label>
                    <input
                      id="stockQuantity"
                      required
                      type="number"
                      value={parentValues.stockQuantity}
                      onChange={e => handleParentFieldChange('stockQuantity', e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="border-t border-border/40 pt-4">
                  <div className="font-mono text-[9px] uppercase tracking-widest text-muted mb-3">Shipping Package Dimensions</div>
                  <div className="grid grid-cols-4 gap-6">
                    <div>
                      <label htmlFor="weight" className={labelCls}>Weight (kg)</label>
                      <input
                        id="weight"
                        type="number"
                        step="0.01"
                        value={parentValues.weight}
                        onChange={e => handleParentFieldChange('weight', e.target.value)}
                        className={inputCls}
                        placeholder="0.5"
                      />
                    </div>
                    <div>
                      <label htmlFor="length" className={labelCls}>Length (cm)</label>
                      <input
                        id="length"
                        type="number"
                        step="0.1"
                        value={parentValues.length}
                        onChange={e => handleParentFieldChange('length', e.target.value)}
                        className={inputCls}
                        placeholder="10"
                      />
                    </div>
                    <div>
                      <label htmlFor="breadth" className={labelCls}>Breadth (cm)</label>
                      <input
                        id="breadth"
                        type="number"
                        step="0.1"
                        value={parentValues.breadth}
                        onChange={e => handleParentFieldChange('breadth', e.target.value)}
                        className={inputCls}
                        placeholder="10"
                      />
                    </div>
                    <div>
                      <label htmlFor="height" className={labelCls}>Height (cm)</label>
                      <input
                        id="height"
                        type="number"
                        step="0.1"
                        value={parentValues.height}
                        onChange={e => handleParentFieldChange('height', e.target.value)}
                        className={inputCls}
                        placeholder="10"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-border/40 pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <div className="font-mono text-[9px] uppercase tracking-widest text-muted">Display Size</div>
                    <div className="flex gap-1 bg-background p-0.5 border border-border rounded-full">
                      <button
                        type="button"
                        onClick={() => setDimensionUnit('CM')}
                        className={`px-3 py-1 rounded-full font-mono text-[9px] transition-all ${
                          dimensionUnit === 'CM' ? 'bg-accent text-black font-semibold' : 'text-muted hover:text-primary'
                        }`}
                      >
                        CM
                      </button>
                      <button
                        type="button"
                        onClick={() => setDimensionUnit('INCH')}
                        className={`px-3 py-1 rounded-full font-mono text-[9px] transition-all ${
                          dimensionUnit === 'INCH' ? 'bg-accent text-black font-semibold' : 'text-muted hover:text-primary'
                        }`}
                      >
                        IN
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <label className={labelCls}>Height ({dimensionUnit === 'CM' ? 'cm' : 'in'})</label>
                      <input
                        type="number"
                        step="0.1"
                        value={parentValues.actualHeight}
                        onChange={e => handleParentFieldChange('actualHeight', e.target.value)}
                        className={inputCls}
                        placeholder="—"
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Width ({dimensionUnit === 'CM' ? 'cm' : 'in'})</label>
                      <input
                        type="number"
                        step="0.1"
                        value={parentValues.actualWidth}
                        onChange={e => handleParentFieldChange('actualWidth', e.target.value)}
                        className={inputCls}
                        placeholder="—"
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Depth ({dimensionUnit === 'CM' ? 'cm' : 'in'}) (Optional)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={parentValues.actualDepth}
                        onChange={e => handleParentFieldChange('actualDepth', e.target.value)}
                        className={inputCls}
                        placeholder="—"
                      />
                    </div>
                  </div>
                </div>
              </CollapsibleCard>

              {/* === TECHNICAL SPECS CARD === */}
              <CollapsibleCard
                id="specs"
                title="Technical Specifications"
                sub="GST, certification, materials, power overrides"
                number="3"
                done={isSpecsComplete}
                isOpen={openSections.specs}
                onToggle={() => setOpenSections(prev => ({ ...prev, specs: !prev.specs }))}
              >
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <label className={labelCls}>GST Rate (%)</label>
                    <select
                      value={parentValues.gstRate}
                      onChange={e => handleParentFieldChange('gstRate', parseInt(e.target.value, 10))}
                      className={inputCls}
                    >
                      <option value={5}>5% (LED)</option>
                      <option value={18}>18% (Traditional)</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>HSN Code</label>
                    <input
                      value={parentValues.hsnCode}
                      onChange={e => handleParentFieldChange('hsnCode', e.target.value)}
                      className={inputCls}
                      placeholder="94054090"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>BIS Certification</label>
                    <input
                      value={parentValues.bisCertification}
                      onChange={e => handleParentFieldChange('bisCertification', e.target.value)}
                      className={inputCls}
                      placeholder="IS 10322"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6 pt-4 border-t border-border/40">
                  <div>
                    <label className={labelCls}>Material &amp; Finish</label>
                    <input
                      value={parentValues.materialAndFinish}
                      onChange={e => handleParentFieldChange('materialAndFinish', e.target.value)}
                      className={inputCls}
                      placeholder="e.g. Brass, Glass"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Bulb Type</label>
                    <input
                      value={parentValues.bulbType}
                      onChange={e => handleParentFieldChange('bulbType', e.target.value)}
                      className={inputCls}
                      placeholder="e.g. E27, E14"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Bulb Design Style</label>
                    <input
                      value={parentValues.style}
                      onChange={e => handleParentFieldChange('style', e.target.value)}
                      className={inputCls}
                      placeholder="e.g. Contemporary, Art Deco"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-border/40">
                  <div>
                    <label className={labelCls}>Power specification *</label>
                    <input
                      required
                      value={parentValues.power}
                      onChange={e => handleParentFieldChange('power', e.target.value)}
                      className={inputCls}
                      placeholder="e.g. Max. 60W"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Voltage specification *</label>
                    <input
                      required
                      value={parentValues.voltage}
                      onChange={e => handleParentFieldChange('voltage', e.target.value)}
                      className={inputCls}
                      placeholder="e.g. 110V-240V AC"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-border/40 space-y-4">
                  <div className="flex justify-between items-center">
                    <label className={labelCls}>Filterable specs overrides</label>
                    <button type="button" onClick={addSpec} className="font-mono text-[9px] uppercase tracking-[0.15em] text-accent border border-accent/30 px-3 py-1 hover:border-accent transition-colors">
                      + Add Spec
                    </button>
                  </div>
                  {specs.map((spec, i) => (
                    <div key={i} className="flex gap-3 items-center">
                      <input value={spec.key} onChange={e => updateSpec(i, 'key', e.target.value)} placeholder="Key (e.g. Bulb Qty)" className={`${inputCls} w-1/3 !py-2`} />
                      <input value={spec.value} onChange={e => updateSpec(i, 'value', e.target.value)} placeholder="Value (e.g. 6)" className={`${inputCls} flex-1 !py-2`} />
                      <button type="button" onClick={() => removeSpec(i)} className="text-red-400 p-2 hover:bg-red-950/20 transition-colors">
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </CollapsibleCard>

              {/* === MARKETPLACE SEO CARD === */}
              <CollapsibleCard
                id="seo"
                title="Marketplace SEO"
                sub="Amazon and Flipkart sync attributes"
                number="4"
                done={isSeoComplete}
                isOpen={openSections.seo}
                onToggle={() => setOpenSections(prev => ({ ...prev, seo: !prev.seo }))}
              >
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <label className={labelCls}>Brand Name</label>
                    <input
                      value={parentValues.brand}
                      onChange={e => handleParentFieldChange('brand', e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Warranty Terms</label>
                    <input
                      value={parentValues.warranty}
                      onChange={e => handleParentFieldChange('warranty', e.target.value)}
                      className={inputCls}
                      placeholder="2 Years Warranty"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Country of Origin</label>
                    <input
                      value={parentValues.countryOfOrigin}
                      onChange={e => handleParentFieldChange('countryOfOrigin', e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="border-t border-border/40 pt-4">
                  <div className="font-mono text-[9px] uppercase tracking-widest text-muted mb-3">Auto-detected on sync — edit to override</div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="relative">
                      <label className={labelCls}>Light Fixture Form</label>
                      <input
                        value={parentValues.amazonFixtureForm}
                        onChange={e => handleParentFieldChange('amazonFixtureForm', e.target.value)}
                        placeholder="Not yet synced"
                        className={inputCls}
                      />
                      <span className="absolute right-3 top-[32px] font-mono text-[8px] uppercase tracking-widest bg-surface-muted text-muted px-2 py-0.5 border border-border">auto · pending</span>
                    </div>
                    <div className="relative">
                      <label className={labelCls}>Mounting Type</label>
                      <input
                        value={parentValues.amazonMountingType}
                        onChange={e => handleParentFieldChange('amazonMountingType', e.target.value)}
                        placeholder="Not yet synced"
                        className={inputCls}
                      />
                      <span className="absolute right-3 top-[32px] font-mono text-[8px] uppercase tracking-widest bg-surface-muted text-muted px-2 py-0.5 border border-border">auto · pending</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border/40 pt-4">
                  <div className="flex justify-between items-baseline mb-1">
                    <label htmlFor="amazonKeywords" className={labelCls}>Generic search keywords</label>
                    <span className="font-mono text-[9px] text-muted">{(parentValues.amazonKeywords || '').length} / 250</span>
                  </div>
                  <input
                    id="amazonKeywords"
                    value={parentValues.amazonKeywords}
                    onChange={e => handleParentFieldChange('amazonKeywords', e.target.value)}
                    placeholder="Leave empty for auto-generated keywords"
                    className={inputCls}
                  />
                </div>

                <div className="border-t border-border/40 pt-4">
                  <label className={labelCls}>Special features (Toggle chips)</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {["Adjustable Height", "Dimmable", "Energy Efficient", "Color Changing", "Rust Resistant"].map(feature => {
                      const isChecked = parentValues.amazonSpecialFeatures?.includes(feature);
                      return (
                        <button
                          key={feature}
                          type="button"
                          onClick={() => {
                            setIsDirty(true);
                            const newFeatures = isChecked
                              ? (parentValues.amazonSpecialFeatures || []).filter((f: string) => f !== feature)
                              : [...(parentValues.amazonSpecialFeatures || []), feature];
                            handleParentFieldChange('amazonSpecialFeatures', newFeatures);
                          }}
                          className={`px-3 py-1.5 rounded-full font-mono text-[10px] uppercase tracking-wider border transition-all ${
                            isChecked 
                              ? 'bg-accent/15 border-accent text-accent font-semibold' 
                              : 'border-border text-muted hover:border-accent/40 hover:text-primary'
                          }`}
                        >
                          {isChecked ? '✓ ' : ''}{feature}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </CollapsibleCard>

              {/* === IMAGES MANAGEMENT CARD === */}
              <CollapsibleCard
                id="images"
                title="Product Images"
                sub="Separate storefront and white background listing media"
                number="5"
                done={isImagesComplete}
                isOpen={openSections.images}
                onToggle={() => setOpenSections(prev => ({ ...prev, images: !prev.images }))}
              >
                {/* 1. STOREFRONT IMAGES */}
                <div className="space-y-4">
                  <h4 className="font-serif text-[16px] text-accent tracking-wide">Remastered Images (Storefront &amp; Socials)</h4>
                  <p className="font-mono text-[10px] text-muted">The first image is the cover photo shown on storefront catalogs.</p>
                  
                  {images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {images.map((url, idx) => (
                        <div key={idx} className="group relative aspect-square border border-border bg-background/40 rounded overflow-hidden">
                          <img src={url} alt="" className="w-full h-full object-cover" />
                          <span className="absolute bottom-2 left-2 bg-black/70 px-2 py-0.5 rounded font-mono text-[9px] text-muted">#{idx + 1}</span>
                          {idx === 0 && (
                            <span className="absolute top-2 left-2 bg-accent text-black font-semibold px-2 py-0.5 rounded font-mono text-[8px] uppercase tracking-wider">Primary</span>
                          )}
                          <button 
                            type="button"
                            onClick={() => {
                              setIsDirty(true);
                              setImages(prev => prev.filter((_, i) => i !== idx));
                            }}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/80 hover:bg-red-600 hover:text-white flex items-center justify-center text-[12px] transition-colors"
                          >
                            ×
                          </button>
                          
                          {/* Reordering Controls */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-4 transition-all">
                            {idx > 0 && (
                              <button 
                                type="button" 
                                onClick={() => moveImage(idx, 'left', false)}
                                className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center text-primary font-mono text-sm hover:border-accent"
                              >
                                ←
                              </button>
                            )}
                            {idx < images.length - 1 && (
                              <button 
                                type="button" 
                                onClick={() => moveImage(idx, 'right', false)}
                                className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center text-primary font-mono text-sm hover:border-accent"
                              >
                                →
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <CloudinaryUpload
                    onUpload={(urls) => {
                      setIsDirty(true);
                      setImages(prev => [...prev, ...urls]);
                    }}
                    defaultImages={[]}
                    multiple={true}
                    label="Upload Remastered Images"
                  />
                </div>

                {/* 2. AMAZON COMPLIANCE WHITE BACKGROUND IMAGES */}
                <div className="space-y-4 pt-6 border-t border-border/40 mt-6">
                  <h4 className="font-serif text-[16px] text-accent tracking-wide">White Background Images (Amazon Listing Compliance)</h4>
                  <p className="font-mono text-[10px] text-muted">Amazon requires the first listing photo to be on a pure white background.</p>

                  {whiteBackgroundImages.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {whiteBackgroundImages.map((url, idx) => (
                        <div key={idx} className="group relative aspect-square border border-border bg-background/40 rounded overflow-hidden">
                          <img src={url} alt="" className="w-full h-full object-cover" />
                          <span className="absolute bottom-2 left-2 bg-black/70 px-2 py-0.5 rounded font-mono text-[9px] text-muted">#{idx + 1}</span>
                          {idx === 0 && (
                            <span className="absolute top-2 left-2 bg-accent text-black font-semibold px-2 py-0.5 rounded font-mono text-[8px] uppercase tracking-wider">Amazon Main</span>
                          )}
                          <button 
                            type="button"
                            onClick={() => {
                              setIsDirty(true);
                              setWhiteBackgroundImages(prev => prev.filter((_, i) => i !== idx));
                            }}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/80 hover:bg-red-600 hover:text-white flex items-center justify-center text-[12px] transition-colors"
                          >
                            ×
                          </button>

                          {/* Reordering Controls */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-4 transition-all">
                            {idx > 0 && (
                              <button 
                                type="button" 
                                onClick={() => moveImage(idx, 'left', true)}
                                className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center text-primary font-mono text-sm hover:border-accent"
                              >
                                ←
                              </button>
                            )}
                            {idx < whiteBackgroundImages.length - 1 && (
                              <button 
                                type="button" 
                                onClick={() => moveImage(idx, 'right', true)}
                                className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center text-primary font-mono text-sm hover:border-accent"
                              >
                                →
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <CloudinaryUpload
                    onUpload={(urls) => {
                      setIsDirty(true);
                      setWhiteBackgroundImages(prev => [...prev, ...urls]);
                    }}
                    defaultImages={[]}
                    multiple={true}
                    label="Upload White Background Images"
                  />
                </div>
              </CollapsibleCard>

            </div>
          ) : (
            /* ========================================================================= */
            /* ========================== ACTIVE VARIANT FORM ========================== */
            /* ========================================================================= */
            <div className="space-y-6 animate-in fade-in duration-200">
              
              <div className="premium-card p-6 space-y-6">
                <div className="flex justify-between items-center border-b border-border pb-4">
                  <h3 className="font-serif text-[20px] text-primary font-medium tracking-wide">
                    Variant specifications override
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDirty(true);
                      removeVariant(activeTab);
                      setActiveTab('parent');
                    }}
                    className="font-mono text-[9px] uppercase tracking-[0.15em] text-rose-400 border border-rose-900/30 px-4 py-2 hover:bg-rose-950/20 transition-colors"
                  >
                    Delete Variant option
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <label className={labelCls}>Variant Name *</label>
                    <input
                      required
                      value={variants[activeTab].name}
                      onChange={e => updateVariantField(activeTab, 'name', e.target.value)}
                      placeholder="e.g. Gold - 48 inch"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Variant SKU *</label>
                    <input
                      required
                      value={variants[activeTab].sku}
                      onChange={e => updateVariantField(activeTab, 'sku', e.target.value)}
                      placeholder="SKU Code"
                      className={`${inputCls} uppercase`}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Stock Qty *</label>
                    <input
                      required
                      type="number"
                      value={variants[activeTab].stockQuantity}
                      onChange={e => updateVariantField(activeTab, 'stockQuantity', e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="border-t border-border/40 pt-6">
                  <div className="font-mono text-[9px] uppercase tracking-widest text-accent mb-3">Overrides: Pricing (Leave blank to inherit parent)</div>
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <label className={labelCls}>MRP Override (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={variants[activeTab].mrp}
                        onChange={e => updateVariantField(activeTab, 'mrp', e.target.value)}
                        placeholder={parentValues.mrp ? `Inherit (₹${parentValues.mrp})` : 'Inherit'}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>D2C Price Override (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={variants[activeTab].d2cPrice}
                        onChange={e => updateVariantField(activeTab, 'd2cPrice', e.target.value)}
                        placeholder={parentValues.d2cPrice ? `Inherit (₹${parentValues.d2cPrice})` : 'Inherit'}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>B2B Price Override (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={variants[activeTab].b2bPrice}
                        onChange={e => updateVariantField(activeTab, 'b2bPrice', e.target.value)}
                        placeholder={parentValues.b2bPrice ? `Inherit (₹${parentValues.b2bPrice})` : 'Inherit'}
                        className={inputCls}
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-border/40 pt-6">
                  <div className="font-mono text-[9px] uppercase tracking-widest text-accent mb-3">Overrides: Shipping dimensions</div>
                  <div className="grid grid-cols-4 gap-6">
                    <div>
                      <label className={labelCls}>Weight (kg)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={variants[activeTab].weight}
                        onChange={e => updateVariantField(activeTab, 'weight', e.target.value)}
                        placeholder={parentValues.weight ? `Inherit (${parentValues.weight} kg)` : 'Inherit'}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Length (cm)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={variants[activeTab].length}
                        onChange={e => updateVariantField(activeTab, 'length', e.target.value)}
                        placeholder={parentValues.length ? `Inherit (${parentValues.length} cm)` : 'Inherit'}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Breadth (cm)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={variants[activeTab].breadth}
                        onChange={e => updateVariantField(activeTab, 'breadth', e.target.value)}
                        placeholder={parentValues.breadth ? `Inherit (${parentValues.breadth} cm)` : 'Inherit'}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Height (cm)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={variants[activeTab].height}
                        onChange={e => updateVariantField(activeTab, 'height', e.target.value)}
                        placeholder={parentValues.height ? `Inherit (${parentValues.height} cm)` : 'Inherit'}
                        className={inputCls}
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-border/40 pt-6">
                  <div className="font-mono text-[9px] uppercase tracking-widest text-accent mb-3">Overrides: Display Dimensions ({dimensionUnit === 'CM' ? 'cm' : 'in'})</div>
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <label className={labelCls}>Height</label>
                      <input
                        type="number"
                        step="0.1"
                        value={variants[activeTab].actualHeight}
                        onChange={e => updateVariantField(activeTab, 'actualHeight', e.target.value)}
                        placeholder={parentValues.actualHeight ? `Inherit (${parentValues.actualHeight})` : 'Inherit'}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Width</label>
                      <input
                        type="number"
                        step="0.1"
                        value={variants[activeTab].actualWidth}
                        onChange={e => updateVariantField(activeTab, 'actualWidth', e.target.value)}
                        placeholder={parentValues.actualWidth ? `Inherit (${parentValues.actualWidth})` : 'Inherit'}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Depth</label>
                      <input
                        type="number"
                        step="0.1"
                        value={variants[activeTab].actualDepth}
                        onChange={e => updateVariantField(activeTab, 'actualDepth', e.target.value)}
                        placeholder={parentValues.actualDepth ? `Inherit (${parentValues.actualDepth})` : 'Inherit'}
                        className={inputCls}
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-border/40 pt-6">
                  <div className="font-mono text-[9px] uppercase tracking-widest text-accent mb-3">Overrides: Technical specs</div>
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <label className={labelCls}>Material &amp; Finish</label>
                      <input
                        value={variants[activeTab].materialAndFinish}
                        onChange={e => updateVariantField(activeTab, 'materialAndFinish', e.target.value)}
                        placeholder={parentValues.materialAndFinish || 'Inherit'}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Bulb Type</label>
                      <input
                        value={variants[activeTab].bulbType}
                        onChange={e => updateVariantField(activeTab, 'bulbType', e.target.value)}
                        placeholder={parentValues.bulbType || 'Inherit'}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Design Style</label>
                      <input
                        value={variants[activeTab].style}
                        onChange={e => updateVariantField(activeTab, 'style', e.target.value)}
                        placeholder={parentValues.style || 'Inherit'}
                        className={inputCls}
                      />
                    </div>
                  </div>
                </div>

                {/* Overrides: custom specs */}
                <div className="pt-6 border-t border-border/40 space-y-4">
                  <div className="flex justify-between items-center">
                    <label className={labelCls}>Variant-specific specs overrides</label>
                    <button type="button" onClick={() => addVariantSpec(activeTab)} className="font-mono text-[9px] uppercase tracking-[0.15em] text-accent border border-accent/30 px-3 py-1 hover:border-accent transition-colors">
                      + Add Variant Spec
                    </button>
                  </div>
                  {variants[activeTab].specs.map((spec, sIdx) => (
                    <div key={sIdx} className="flex gap-3 items-center">
                      <input value={spec.key} onChange={e => updateVariantSpec(activeTab, sIdx, 'key', e.target.value)} placeholder="Key (e.g. Frame Color)" className={`${inputCls} w-1/3 !py-2`} />
                      <input value={spec.value} onChange={e => updateVariantSpec(activeTab, sIdx, 'value', e.target.value)} placeholder="Value (e.g. Polished Chrome)" className={`${inputCls} flex-1 !py-2`} />
                      <button type="button" onClick={() => removeVariantSpec(activeTab, sIdx)} className="text-red-400 p-2 hover:bg-red-950/20 transition-colors">
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                {/* Overrides: Amazon SEO & keywords */}
                <div className="pt-6 border-t border-border/40 grid grid-cols-2 gap-6">
                  <div className="col-span-2 font-mono text-[9px] uppercase tracking-widest text-accent mb-1">Platform listing overrides</div>
                  <div>
                    <label className={labelCls}>Brand Override</label>
                    <input
                      value={variants[activeTab].brand}
                      onChange={e => updateVariantField(activeTab, 'brand', e.target.value)}
                      placeholder={parentValues.brand || 'Inherit'}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Warranty Override</label>
                    <input
                      value={variants[activeTab].warranty}
                      onChange={e => updateVariantField(activeTab, 'warranty', e.target.value)}
                      placeholder={parentValues.warranty || 'Inherit'}
                      className={inputCls}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>Google Product Category Override</label>
                    <select
                      value={variants[activeTab].googleProductCategory}
                      onChange={e => updateVariantField(activeTab, 'googleProductCategory', e.target.value)}
                      className={inputCls}
                    >
                      <option value="">Inherit Parent ({parentValues.googleProductCategory || 'None'})</option>
                      {GOOGLE_PRODUCT_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Variant Images upload */}
                <div className="pt-6 border-t border-border/40 space-y-6">
                  {/* Variant Standard Images */}
                  <div className="space-y-4">
                    <h4 className="font-serif text-[16px] text-accent tracking-wide">Variant Remastered Images</h4>
                    <p className="font-mono text-[10px] text-muted">Variant-specific marketing images (inherits parent if left blank).</p>
                    
                    {variants[activeTab].images ? (
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {variants[activeTab].images.split(',').map((s) => s.trim()).filter(Boolean).map((url, idx) => (
                          <div key={idx} className="group relative aspect-square border border-border bg-background/40 rounded overflow-hidden">
                            <img src={url} alt="" className="w-full h-full object-cover" />
                            <span className="absolute bottom-2 left-2 bg-black/70 px-2 py-0.5 rounded font-mono text-[9px] text-muted">#{idx + 1}</span>
                            <button 
                              type="button"
                              onClick={() => {
                                setIsDirty(true);
                                const updated = variants[activeTab].images.split(',').map(s => s.trim()).filter(Boolean).filter((_, i) => i !== idx);
                                updateVariantField(activeTab, 'images', updated.join(', '));
                              }}
                              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/80 hover:bg-red-600 hover:text-white flex items-center justify-center text-[12px] transition-colors"
                            >
                              ×
                            </button>

                            {/* Reordering Controls */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-4 transition-all">
                              {idx > 0 && (
                                <button 
                                  type="button" 
                                  onClick={() => moveVariantImage(activeTab, idx, 'left', false)}
                                  className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center text-primary font-mono text-sm hover:border-accent"
                                >
                                  ←
                                </button>
                              )}
                              {idx < variants[activeTab].images.split(',').map(s => s.trim()).filter(Boolean).length - 1 && (
                                <button 
                                  type="button" 
                                  onClick={() => moveVariantImage(activeTab, idx, 'right', false)}
                                  className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center text-primary font-mono text-sm hover:border-accent"
                                >
                                  →
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    <CloudinaryUpload
                      onUpload={(urls) => {
                        setIsDirty(true);
                        const existing = variants[activeTab].images ? variants[activeTab].images.split(',').map(s => s.trim()).filter(Boolean) : [];
                        updateVariantField(activeTab, 'images', [...existing, ...urls].join(', '));
                      }}
                      defaultImages={[]}
                      multiple={true}
                      label="Add Variant Images"
                    />
                  </div>

                  {/* Variant White Background Images */}
                  <div className="space-y-4 pt-6 border-t border-border/40">
                    <h4 className="font-serif text-[16px] text-accent tracking-wide">Variant White Background Images (Amazon)</h4>
                    <p className="font-mono text-[10px] text-muted">Variant-specific white background images (inherits parent if left blank).</p>

                    {variants[activeTab].whiteBackgroundImages ? (
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {variants[activeTab].whiteBackgroundImages.split(',').map((s) => s.trim()).filter(Boolean).map((url, idx) => (
                          <div key={idx} className="group relative aspect-square border border-border bg-background/40 rounded overflow-hidden">
                            <img src={url} alt="" className="w-full h-full object-cover" />
                            <span className="absolute bottom-2 left-2 bg-black/70 px-2 py-0.5 rounded font-mono text-[9px] text-muted">#{idx + 1}</span>
                            <button 
                              type="button"
                              onClick={() => {
                                setIsDirty(true);
                                const updated = variants[activeTab].whiteBackgroundImages.split(',').map(s => s.trim()).filter(Boolean).filter((_, i) => i !== idx);
                                updateVariantField(activeTab, 'whiteBackgroundImages', updated.join(', '));
                              }}
                              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/80 hover:bg-red-600 hover:text-white flex items-center justify-center text-[12px] transition-colors"
                            >
                              ×
                            </button>

                            {/* Reordering Controls */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-4 transition-all">
                              {idx > 0 && (
                                <button 
                                  type="button" 
                                  onClick={() => moveVariantImage(activeTab, idx, 'left', true)}
                                  className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center text-primary font-mono text-sm hover:border-accent"
                                >
                                  ←
                                </button>
                              )}
                              {idx < variants[activeTab].whiteBackgroundImages.split(',').map(s => s.trim()).filter(Boolean).length - 1 && (
                                <button 
                                  type="button" 
                                  onClick={() => moveVariantImage(activeTab, idx, 'right', true)}
                                  className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center text-primary font-mono text-sm hover:border-accent"
                                >
                                  →
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    <CloudinaryUpload
                      onUpload={(urls) => {
                        setIsDirty(true);
                        const existing = variants[activeTab].whiteBackgroundImages ? variants[activeTab].whiteBackgroundImages.split(',').map(s => s.trim()).filter(Boolean) : [];
                        updateVariantField(activeTab, 'whiteBackgroundImages', [...existing, ...urls].join(', '));
                      }}
                      defaultImages={[]}
                      multiple={true}
                      label="Add Variant White Background Images"
                    />
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* === FOOTER ACTIONS === */}
          <div className="pt-6 border-t border-border flex justify-between items-center mt-6">
            <span className="font-mono text-[10px] text-muted uppercase tracking-widest">
              Catalogue and inventory sync automatically with Shiprocket on save.
            </span>
            <div className="flex gap-3">
              <button 
                type="button" 
                onClick={() => router.back()} 
                className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted border border-border px-6 py-3 hover:text-primary transition-colors bg-background"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={saving} 
                className="px-6 py-3 font-mono text-[9px] uppercase tracking-[0.15em] bg-accent text-black hover:bg-accent-hover transition-colors font-bold disabled:opacity-50"
              >
                {saving ? 'Saving...' : mode === 'add' ? 'Save Product' : 'Update Product'}
              </button>
            </div>
          </div>
        </main>
      </div>
    </form>
  );
}

interface CollapsibleCardProps {
  id: string;
  title: string;
  sub: string;
  number: string | number;
  done: boolean;
  warn?: boolean;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function CollapsibleCard({
  id,
  title,
  sub,
  number,
  done,
  warn,
  isOpen,
  onToggle,
  children
}: CollapsibleCardProps) {
  return (
    <section id={id} className="premium-card flex flex-col overflow-hidden mb-6">
      <div 
        onClick={onToggle}
        className="px-6 py-5 border-b border-border flex justify-between items-center cursor-pointer select-none bg-surface-muted/30 hover:bg-surface-muted/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          {done ? (
            <span className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500 text-emerald-400 flex items-center justify-center text-[10px] font-semibold">✓</span>
          ) : warn ? (
            <span className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500 text-amber-400 flex items-center justify-center text-[10px] font-semibold">!</span>
          ) : (
            <span className="w-6 h-6 rounded-full border border-border-strong text-muted flex items-center justify-center text-[10px] font-mono">{number}</span>
          )}
          <div>
            <h3 className="font-serif text-[18px] text-primary font-medium tracking-wide">{title}</h3>
            <p className="font-mono text-[9px] text-muted uppercase tracking-widest mt-0.5">{sub}</p>
          </div>
        </div>
        <span className={`text-[18px] text-muted transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}>›</span>
      </div>
      {isOpen && (
        <div className="p-6 space-y-6 bg-surface/30">
          {children}
        </div>
      )}
    </section>
  );
}
