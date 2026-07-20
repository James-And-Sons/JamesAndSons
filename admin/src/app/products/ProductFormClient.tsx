'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CloudinaryUpload from '@/components/CloudinaryUpload';
import SyncButton from '@/components/SyncButton';
import { useSidebar } from '@/lib/context/SidebarContext';

type Category = { 
  id: string; 
  name: string; 
  technicalSubheading?: string | null;
  hsnCode?: string | null;
  gstRate?: number | null;
  bisStandard?: string | null;
  bisStatus?: string | null;
};
type Space = { id: string; name: string };
type Spec = { id: string; key: string; value: string };

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

import { createPortal } from 'react-dom';

interface DropdownOption {
  value: string;
  label: string;
}

interface CustomDropdownProps {
  value: string;
  options: DropdownOption[];
  onChange: (val: string) => void;
  placeholder?: string;
  required?: boolean;
}

function CustomDropdown({ value, options, onChange, placeholder = "Select...", required }: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const updateCoords = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      window.addEventListener('resize', updateCoords);
      window.addEventListener('scroll', updateCoords, true);
    }
    return () => {
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords, true);
    };
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        buttonRef.current && !buttonRef.current.contains(event.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value);

  return (
    <div className="relative w-full font-sans text-[13px]">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-background border border-border px-4 py-3 text-[13px] text-primary focus:outline-none focus:border-accent transition-colors flex items-center justify-between cursor-pointer rounded-sm"
      >
        <span className={selectedOption ? 'text-primary' : 'text-muted/60'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className={`text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true">▾</span>
      </button>

      {isOpen && typeof window !== 'undefined' && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: 'absolute',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            width: `${coords.width}px`,
          }}
          className="bg-surface border border-border shadow-xl z-[9999] max-h-60 overflow-y-auto rounded-sm py-1 font-sans text-[13px]"
        >
          {placeholder && !required && (
            <button
              type="button"
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-surface-muted hover:text-primary transition-colors text-muted/60 text-[13px] cursor-pointer"
            >
              {placeholder}
            </button>
          )}
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 hover:bg-surface-muted transition-colors text-[13px] flex items-center justify-between cursor-pointer ${
                opt.value === value ? 'bg-surface-muted text-accent font-semibold' : 'text-secondary'
              }`}
            >
              <span>{opt.label}</span>
              {opt.value === value && <span>✓</span>}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}


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

function getLogicalDefaultsForCategory(catName: string) {
  const name = catName ? catName.toLowerCase() : '';
  
  if (name.includes('chandelier')) {
    return {
      amazonFixtureForm: 'Chandelier',
      amazonMountingType: 'Ceiling Mount',
      amazonLightingMethod: 'Ambient',
      amazonWaterResistance: 'IP20 Indoor Use Only',
      amazonTheme: 'Modern Luxury',
      googleProductCategory: 'Home & Garden > Lighting > Light Fixtures > Chandeliers',
    };
  }
  if (name.includes('pendant')) {
    return {
      amazonFixtureForm: 'Pendant',
      amazonMountingType: 'Ceiling Mount',
      amazonLightingMethod: 'Downlight & Ambient',
      amazonWaterResistance: 'IP20 Indoor Use Only',
      amazonTheme: 'Modern Luxury',
      googleProductCategory: 'Home & Garden > Lighting > Light Fixtures > Ceiling Light Fixtures',
    };
  }
  if (name.includes('wall') || name.includes('sconce')) {
    return {
      amazonFixtureForm: 'Sconce',
      amazonMountingType: 'Wall Mount',
      amazonLightingMethod: 'Up/Down Light',
      amazonWaterResistance: 'IP20 Indoor Use Only',
      amazonTheme: 'Modern Luxury',
      googleProductCategory: 'Home & Garden > Lighting > Light Fixtures > Wall Light Fixtures',
    };
  }
  if (name.includes('table') || name.includes('desk')) {
    return {
      amazonFixtureForm: 'Table Lamp',
      amazonMountingType: 'Tabletop',
      amazonLightingMethod: 'Task & Accent',
      amazonWaterResistance: 'IP20 Indoor Use Only',
      amazonTheme: 'Modern Luxury',
      googleProductCategory: 'Home & Garden > Lighting > Light Fixtures > Lamps',
    };
  }
  if (name.includes('floor')) {
    return {
      amazonFixtureForm: 'Floor Lamp',
      amazonMountingType: 'Freestanding',
      amazonLightingMethod: 'Ambient & Accent',
      amazonWaterResistance: 'IP20 Indoor Use Only',
      amazonTheme: 'Modern Luxury',
      googleProductCategory: 'Home & Garden > Lighting > Light Fixtures > Lamps',
    };
  }
  if (name.includes('ceiling') || name.includes('flush')) {
    return {
      amazonFixtureForm: 'Close to Ceiling',
      amazonMountingType: 'Flush Mount',
      amazonLightingMethod: 'General Downlight',
      amazonWaterResistance: 'IP20 Indoor Use Only',
      amazonTheme: 'Modern Luxury',
      googleProductCategory: 'Home & Garden > Lighting > Light Fixtures > Ceiling Light Fixtures',
    };
  }
  if (name.includes('track')) {
    return {
      amazonFixtureForm: 'Track Light',
      amazonMountingType: 'Track Mount',
      amazonLightingMethod: 'Spotlight',
      amazonWaterResistance: 'IP20 Indoor Use Only',
      amazonTheme: 'Modern Architectural',
      googleProductCategory: 'Home & Garden > Lighting > Light Fixtures > Track Lighting',
    };
  }
  if (name.includes('outdoor')) {
    return {
      amazonFixtureForm: 'Outdoor Wall Light',
      amazonMountingType: 'Wall Mount',
      amazonLightingMethod: 'Outdoor Ambient',
      amazonWaterResistance: 'IP65 Weatherproof',
      amazonTheme: 'Modern Architectural',
      googleProductCategory: 'Home & Garden > Lighting > Light Fixtures',
    };
  }

  return {
    amazonFixtureForm: 'Light Fixture',
    amazonMountingType: 'Ceiling / Wall Mount',
    amazonLightingMethod: 'Ambient',
    amazonWaterResistance: 'IP20 Indoor Use Only',
    amazonTheme: 'Modern Luxury',
    googleProductCategory: 'Home & Garden > Lighting > Light Fixtures',
  };
}

export default function ProductFormClient({ categories, spaces, defaultValues, mode }: {
  categories: Category[];
  spaces: Space[];
  defaultValues?: any;
  mode: 'add' | 'edit';
}) {
  const router = useRouter();
  const { setProductFormState } = useSidebar();
  const formRef = useRef<HTMLFormElement>(null);
  const triggerSubmit = () => {
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
  };
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
    material: defaultValues?.material || '',
    countryOfOrigin: defaultValues?.countryOfOrigin || 'India',
    brand: defaultValues?.brand || 'James and Sons',
    warranty: defaultValues?.warranty || '',
    bulletPoints: defaultValues?.bulletPoints?.join('\n') || '',
    googleProductCategory: defaultValues?.googleProductCategory || getLogicalDefaultsForCategory(categories.find(c => c.id === defaultValues?.categoryId)?.name || '').googleProductCategory,
    amazonFixtureForm: defaultValues?.amazonFixtureForm || getLogicalDefaultsForCategory(categories.find(c => c.id === defaultValues?.categoryId)?.name || '').amazonFixtureForm,
    amazonMountingType: defaultValues?.amazonMountingType || getLogicalDefaultsForCategory(categories.find(c => c.id === defaultValues?.categoryId)?.name || '').amazonMountingType,
    amazonLightingMethod: defaultValues?.amazonLightingMethod || getLogicalDefaultsForCategory(categories.find(c => c.id === defaultValues?.categoryId)?.name || '').amazonLightingMethod,
    amazonWaterResistance: defaultValues?.amazonWaterResistance || getLogicalDefaultsForCategory(categories.find(c => c.id === defaultValues?.categoryId)?.name || '').amazonWaterResistance,
    amazonTheme: defaultValues?.amazonTheme || getLogicalDefaultsForCategory(categories.find(c => c.id === defaultValues?.categoryId)?.name || '').amazonTheme,
    amazonSpecialFeatures: defaultValues?.amazonSpecialFeatures || [] as string[],
    amazonIncludedComponents: defaultValues?.amazonIncludedComponents || '',
    amazonKeywords: defaultValues?.amazonKeywords || '',
  });

  // AI assistant states
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [aiTone, setAiTone] = useState('Luxurious & Regal');
  const [aiType, setAiType] = useState('');
  const [aiKeywords, setAiKeywords] = useState('');
  const [generatingAi, setGeneratingAi] = useState(false);
  const [aiResult, setAiResult] = useState<any | null>(null);

  const handleGenerateAiListing = async () => {
    if (!aiKeywords.trim()) {
      alert('Please enter some keywords or specifications.');
      return;
    }
    setGeneratingAi(true);
    try {
      const res = await fetch('/api/admin/generate-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiKeywords,
          type: aiType || undefined,
          tone: aiTone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate copy');
      setAiResult(data.data);
    } catch (err: any) {
      console.error(err);
      alert(`Error generating listing: ${err.message}`);
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleApplyAiListing = () => {
    if (!aiResult) return;
    setIsDirty(true);
    setParentValues(prev => ({
      ...prev,
      name: aiResult.name || prev.name,
      description: aiResult.description || prev.description,
      bulletPoints: Array.isArray(aiResult.bulletPoints) ? aiResult.bulletPoints.join('\n') : (aiResult.bulletPoints || prev.bulletPoints),
      materialAndFinish: Array.isArray(aiResult.materialAndFinish) ? aiResult.materialAndFinish.join(', ') : (aiResult.materialAndFinish || prev.materialAndFinish),
      bulbType: Array.isArray(aiResult.bulbType) ? aiResult.bulbType.join(', ') : (aiResult.bulbType || prev.bulbType),
      style: Array.isArray(aiResult.style) ? aiResult.style.join(', ') : (aiResult.style || prev.style),
      power: aiResult.power || prev.power,
      voltage: aiResult.voltage || prev.voltage,
      isLed: typeof aiResult.isLed === 'boolean' ? aiResult.isLed : prev.isLed,
      hsnCode: aiResult.hsnCode || prev.hsnCode,
      gstRate: typeof aiResult.gstRate === 'number' ? aiResult.gstRate : prev.gstRate,
      color: aiResult.color || prev.color,
      size: aiResult.size || prev.size,
      material: aiResult.material || prev.material,
      countryOfOrigin: aiResult.countryOfOrigin || prev.countryOfOrigin,
      brand: aiResult.brand || prev.brand,
      warranty: aiResult.warranty || prev.warranty,
      googleProductCategory: aiResult.googleProductCategory || prev.googleProductCategory,
      amazonFixtureForm: aiResult.amazonFixtureForm || prev.amazonFixtureForm,
      amazonMountingType: aiResult.amazonMountingType || prev.amazonMountingType,
      amazonLightingMethod: aiResult.amazonLightingMethod || prev.amazonLightingMethod,
      amazonWaterResistance: aiResult.amazonWaterResistance || prev.amazonWaterResistance,
      amazonTheme: aiResult.amazonTheme || prev.amazonTheme,
      amazonSpecialFeatures: Array.isArray(aiResult.amazonSpecialFeatures) ? aiResult.amazonSpecialFeatures : (aiResult.amazonSpecialFeatures || prev.amazonSpecialFeatures),
      amazonIncludedComponents: aiResult.amazonIncludedComponents || prev.amazonIncludedComponents,
      amazonKeywords: aiResult.amazonKeywords || prev.amazonKeywords,
    }));
    setShowAiAssistant(false);
    setAiResult(null);
  };


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
      ? Object.entries(defaultValues.specs).map(([key, value]) => ({ 
          id: `parent-${key}`, 
          key, 
          value: String(value) 
        }))
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
        ? Object.entries(v.specs).map(([key, value]) => ({ 
            id: `var-${v.id || v.sku || Math.random().toString(36).substring(2, 9)}-${key}`, 
            key, 
            value: String(value) 
          }))
        : [],
    })) || []
  );

  // Warning check states
  const [openSections, setOpenSections] = useState({
    basic: true,
    pricing: true,
    specs: false,
    seo: false,
    images: true,
    v_basic: true,
    v_pricing: true,
    v_dimensions: false,
    v_specs: false,
    v_platform: false,
    v_images: true
  });

  // Warn if B2B Price equals MRP
  const showB2BWarning = !!(parentValues.b2bPrice && parentValues.mrp && Number(parentValues.b2bPrice) === Number(parentValues.mrp));

  // Completion dot logic helper
  const isBasicComplete = !!(parentValues.name && parentValues.sku && parentValues.categoryId);
  const isPricingComplete = !!(parentValues.mrp && parentValues.d2cPrice && parentValues.b2bPrice && parentValues.stockQuantity);
  const isSpecsComplete = !!(parentValues.power && parentValues.voltage);
  const isSeoComplete = !!(parentValues.brand);
  const isImagesComplete = images.length > 0;

  // Active variant checklist overrides indicators
  const isVarBasicComplete = activeTab !== 'parent' && typeof activeTab === 'number' && !!(
    variants[activeTab]?.name &&
    variants[activeTab]?.sku &&
    variants[activeTab]?.stockQuantity
  );
  const isVarPricingComplete = activeTab !== 'parent' && typeof activeTab === 'number';
  const isVarDimensionsComplete = activeTab !== 'parent' && typeof activeTab === 'number';
  const isVarSpecsComplete = activeTab !== 'parent' && typeof activeTab === 'number';
  const isVarPlatformComplete = activeTab !== 'parent' && typeof activeTab === 'number';
  const isVarImagesComplete = activeTab !== 'parent' && typeof activeTab === 'number' && !!(
    variants[activeTab]?.images || variants[activeTab]?.whiteBackgroundImages
  );

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
    setParentValues(prev => {
      const updated = { ...prev, [field]: val };
      if (field === 'categoryId') {
        const cat = categories.find(c => c.id === val);
        if (cat) {
          updated.hsnCode = cat.hsnCode || updated.hsnCode || '';
          updated.gstRate = cat.gstRate !== null && cat.gstRate !== undefined ? cat.gstRate : 18;
          updated.bisCertification = cat.bisStandard || updated.bisCertification || '';

          const inferred = getLogicalDefaultsForCategory(cat.name);
          if (!updated.amazonFixtureForm || updated.amazonFixtureForm === 'Light Fixture') updated.amazonFixtureForm = inferred.amazonFixtureForm;
          if (!updated.amazonMountingType || updated.amazonMountingType === 'Ceiling / Wall Mount') updated.amazonMountingType = inferred.amazonMountingType;
          if (!updated.amazonLightingMethod) updated.amazonLightingMethod = inferred.amazonLightingMethod;
          if (!updated.amazonWaterResistance) updated.amazonWaterResistance = inferred.amazonWaterResistance;
          if (!updated.amazonTheme) updated.amazonTheme = inferred.amazonTheme;
          if (!updated.googleProductCategory) updated.googleProductCategory = inferred.googleProductCategory;
        }
      }
      return updated;
    });
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
    setVariants(prev => prev.map((v, i) => i === vIdx ? { 
      ...v, 
      specs: [...v.specs, { id: Math.random().toString(36).substring(2, 9), key: '', value: '' }] 
    } : v));
  };

  const updateVariantSpec = (vIdx: number, specId: string, field: 'key' | 'value', val: string) => {
    setIsDirty(true);
    setVariants(prev => prev.map((v, i) => {
      if (i === vIdx) {
        const newSpecs = v.specs.map(s => s.id === specId ? { ...s, [field]: val } : s);
        return { ...v, specs: newSpecs };
      }
      return v;
    }));
  };

  const removeVariantSpec = (vIdx: number, specId: string) => {
    setIsDirty(true);
    setVariants(prev => prev.map((v, i) => {
      if (i === vIdx) {
        const newSpecs = v.specs.filter(s => s.id !== specId);
        return { ...v, specs: newSpecs };
      }
      return v;
    }));
  };

  // Parent specs functions
  const addSpec = () => {
    setIsDirty(true);
    setSpecs(prev => [...prev, { id: Math.random().toString(36).substring(2, 9), key: '', value: '' }]);
  };
  
  const updateSpec = (specId: string, field: 'key' | 'value', val: string) => {
    setIsDirty(true);
    setSpecs(prev => prev.map(s => s.id === specId ? { ...s, [field]: val } : s));
  };
  
  const removeSpec = (specId: string) => {
    setIsDirty(true);
    setSpecs(prev => prev.filter(s => s.id !== specId));
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

  // Sync form state to contextual sidebar outline
  useEffect(() => {
    setProductFormState({
      mode,
      productId: defaultValues?.id,
      productName: parentValues.name,
      sku: parentValues.sku,
      isDirty,
      activeTab,
      setActiveTab,
      variants: variants.map(v => ({ name: v.name, sku: v.sku })),
      addVariant: () => {
        setIsDirty(true);
        addVariant();
      },
      removeVariant: (idx) => {
        setIsDirty(true);
        removeVariant(idx);
      },
      isBasicComplete,
      isPricingComplete,
      isSpecsComplete,
      isSeoComplete,
      isImagesComplete,
      isVarBasicComplete,
      isVarPricingComplete,
      isVarDimensionsComplete,
      isVarSpecsComplete,
      isVarPlatformComplete,
      isVarImagesComplete,
      openSections,
      setOpenSections,
      submitForm: triggerSubmit,
      saving
    });

    return () => {
      setProductFormState(null);
    };
  }, [
    mode,
    parentValues.name,
    parentValues.sku,
    isDirty,
    activeTab,
    variants,
    isBasicComplete,
    isPricingComplete,
    isSpecsComplete,
    isSeoComplete,
    isImagesComplete,
    isVarBasicComplete,
    isVarPricingComplete,
    isVarDimensionsComplete,
    isVarSpecsComplete,
    isVarPlatformComplete,
    isVarImagesComplete,
    openSections,
    setProductFormState,
    saving
  ]);

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

  const inputCls = "w-full bg-background border border-border px-4 py-3 text-[13px] font-sans text-primary focus:outline-none focus:border-accent transition-colors";
  const selectCls = "w-full bg-background border border-border px-4 py-3 text-[13px] font-sans text-primary focus:outline-none focus:border-accent transition-colors appearance-none pr-10 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M7%209l3%203%203-3%22%20stroke%3D%22%23a1a1aa%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%2%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_16px_center] bg-[size:20px_20px] bg-no-repeat cursor-pointer";
  const labelCls = "font-mono text-[10px] uppercase tracking-[0.15em] text-muted block mb-1";


  const handleCancelClick = (e: React.MouseEvent) => {
    if (isDirty) {
      if (!confirm('You have unsaved changes. Are you sure you want to leave?')) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
    }
    // If it's the cancel button click, redirect back to catalog
    if (e.currentTarget.tagName === 'BUTTON') {
      router.push('/products');
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 border border-red-900 bg-red-900/10 text-red-400 font-mono text-[12px]">{error}</div>
      )}

      {/* === STICKY TOP BAR REDESIGN === */}
      <div className="lg:hidden sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border py-4 px-6 -mx-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link 
            href="/products" 
            onClick={handleCancelClick}
            className="p-2 text-muted hover:text-accent border border-border bg-background transition-colors rounded-sm"
            title="Back to Catalog"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M19 12H5M5 12L12 19M5 12L12 5" /></svg>
          </Link>
          <div>
            <div className="flex items-baseline gap-3">
              <h1 className="font-serif text-[20px] text-primary font-light tracking-wide">
                {parentValues.name || 'New Product'}
              </h1>
              {parentValues.sku && (
                <span className="font-mono text-[9px] text-muted border border-border px-1.5 py-0.5 rounded uppercase">
                  {parentValues.sku}
                </span>
              )}
            </div>
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
              onClick={handleCancelClick} 
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
              className={`px-5 py-2.5 font-mono text-[9px] uppercase tracking-[0.15em] transition-all duration-200 rounded-sm
                ${(mode === 'add' || isDirty) 
                  ? 'bg-accent text-black hover:bg-accent-hover font-bold shadow-md shadow-accent/15' 
                  : 'border border-border text-muted bg-transparent hover:text-primary hover:border-muted font-normal'
                }
                disabled:opacity-50`}
            >
              {saving ? 'Saving...' : mode === 'add' ? 'Save Product' : 'Update Product'}
            </button>
            {mode === 'edit' && defaultValues?.slug && (
              <a
                href={`${process.env.NEXT_PUBLIC_STOREFRONT_URL || 'http://localhost:3001'}/products/${defaultValues.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 font-mono text-[9px] uppercase tracking-[0.15em] text-emerald-400 border border-emerald-400/30 bg-transparent hover:bg-emerald-400/10 hover:border-emerald-400 transition-colors rounded-sm flex items-center gap-1"
              >
                View Listing ↗
              </a>
            )}
          </div>
        </div>
      </div>

      {/* === FULL WIDTH FORM LAYOUT === */}
      <div className="w-full">
          {activeTab === 'parent' ? (
            <div className="space-y-6">
              {/* === AI LISTING ASSISTANT BANNER / TRIGGER === */}
              <div className="premium-card p-4 rounded-lg bg-surface border border-accent/30 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center text-accent font-serif text-lg">
                      ✨
                    </div>
                    <div>
                      <div className="font-serif text-[16px] text-accent tracking-wide font-normal">
                        AI Product Listing Generator
                      </div>
                      <div className="font-mono text-[9px] text-muted uppercase tracking-wider">
                        Auto-fill all specs, listing narrative, and marketplace SEO attributes
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAiAssistant(!showAiAssistant)}
                    className="px-4 py-2 bg-accent/15 border border-accent/40 text-accent hover:bg-accent hover:text-black font-mono text-[10px] uppercase tracking-wider rounded-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>{showAiAssistant ? 'Hide AI Assistant ▲' : '✨ Generate Listing with AI ▼'}</span>
                  </button>
                </div>

                {showAiAssistant && (
                  <div className="pt-3 border-t border-border/40 space-y-4 font-sans">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="font-mono text-[9px] uppercase tracking-widest text-muted block mb-1">Tone &amp; Brand Voice</label>
                        <CustomDropdown
                          value={aiTone}
                          options={[
                            { value: 'Luxurious & Regal', label: 'Luxurious & Regal' },
                            { value: 'Minimalist & Modern', label: 'Minimalist & Modern' },
                            { value: 'Bold & Dramatic', label: 'Bold & Dramatic' },
                            { value: 'Technical & Detailed', label: 'Technical & Detailed' },
                          ]}
                          onChange={setAiTone}
                          placeholder="Select Tone"
                        />
                      </div>
                      <div>
                        <label className="font-mono text-[9px] uppercase tracking-widest text-muted block mb-1">Product Category Context</label>
                        <input
                          type="text"
                          value={aiType}
                          onChange={e => setAiType(e.target.value)}
                          placeholder="e.g. Chandelier, Wall Sconce, Floor Lamp"
                          className={inputCls}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="font-mono text-[9px] uppercase tracking-widest text-muted block mb-1">Keywords / Materials / Design Highlights</label>
                      <textarea
                        value={aiKeywords}
                        onChange={e => setAiKeywords(e.target.value)}
                        placeholder="e.g. solid brass, hand-cut crystal drops, warm ambient LED, dimmable, grand entrance hall..."
                        className={inputCls}
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        disabled={generatingAi}
                        onClick={handleGenerateAiListing}
                        className="px-5 py-2.5 bg-accent text-black font-mono text-[10px] uppercase tracking-wider rounded-sm font-bold disabled:opacity-50 cursor-pointer shadow-md shadow-accent/10"
                      >
                        {generatingAi ? 'Generating Listing...' : '✨ Generate Full Listing Copy & SEO'}
                      </button>
                    </div>

                    {aiResult && (
                      <div className="mt-4 p-4 bg-background/80 border border-accent/40 rounded-sm space-y-3">
                        <div className="font-mono text-[9px] uppercase tracking-widest text-accent font-semibold flex justify-between items-center">
                          <span>Generation Preview</span>
                          <span className="text-muted font-normal">All fields ready to auto-populate</span>
                        </div>
                        <div>
                          <div className="font-mono text-[9px] text-muted uppercase">Title</div>
                          <div className="font-serif text-[17px] text-primary">{aiResult.name}</div>
                        </div>
                        <div>
                          <div className="font-mono text-[9px] text-muted uppercase">Description Narrative</div>
                          <div className="font-sans text-[12px] text-secondary whitespace-pre-wrap leading-relaxed">{aiResult.description}</div>
                        </div>
                        {aiResult.bulletPoints && (
                          <div>
                            <div className="font-mono text-[9px] text-muted uppercase">Bullet Points</div>
                            <ul className="list-disc pl-4 font-sans text-[12px] text-secondary space-y-1">
                              {aiResult.bulletPoints.map((bp: string, i: number) => (
                                <li key={i}>{bp}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="pt-2 border-t border-border/30">
                          <div className="font-mono text-[9px] text-accent uppercase font-semibold mb-1.5">Generated Specifications &amp; Marketplace Attributes</div>
                          <div className="flex flex-wrap gap-1.5 font-mono text-[9px]">
                            {aiResult.material && <span className="bg-surface border border-border px-2 py-0.5 rounded text-secondary">Material: {aiResult.material}</span>}
                            {aiResult.power && <span className="bg-surface border border-border px-2 py-0.5 rounded text-secondary">Power: {aiResult.power}</span>}
                            {aiResult.voltage && <span className="bg-surface border border-border px-2 py-0.5 rounded text-secondary">Voltage: {aiResult.voltage}</span>}
                            {aiResult.hsnCode && <span className="bg-surface border border-border px-2 py-0.5 rounded text-secondary">HSN: {aiResult.hsnCode}</span>}
                            {aiResult.amazonFixtureForm && <span className="bg-surface border border-border px-2 py-0.5 rounded text-secondary">Form: {aiResult.amazonFixtureForm}</span>}
                            {aiResult.amazonMountingType && <span className="bg-surface border border-border px-2 py-0.5 rounded text-secondary">Mount: {aiResult.amazonMountingType}</span>}
                            {aiResult.amazonKeywords && <span className="bg-surface border border-border px-2 py-0.5 rounded text-secondary truncate max-w-full">Keywords: {aiResult.amazonKeywords}</span>}
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-3 border-t border-border/40">
                          <button
                            type="button"
                            onClick={handleApplyAiListing}
                            className="px-5 py-2.5 border border-accent text-accent hover:bg-accent hover:text-black font-mono text-[10px] uppercase tracking-wider rounded-sm font-bold transition-all cursor-pointer shadow-lg shadow-accent/15"
                          >
                            Apply All Fields to Listing Form
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

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
                    <CustomDropdown
                      value={parentValues.categoryId}
                      options={categories.map(c => ({ value: c.id, label: c.name }))}
                      onChange={val => handleParentFieldChange('categoryId', val)}
                      placeholder="Select Category"
                      required
                    />
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
                    <div className="font-mono text-[9px] uppercase tracking-widest text-muted">Product Dimensions</div>
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
                    <input
                      value={parentValues.gstRate ? `${parentValues.gstRate}%` : '—'}
                      readOnly
                      className={`${inputCls} opacity-60 cursor-not-allowed`}
                    />
                    <p className="font-mono text-[9px] text-muted mt-1">Managed by Category</p>
                  </div>
                  <div>
                    <label className={labelCls}>HSN Code</label>
                    <input
                      value={parentValues.hsnCode || '—'}
                      readOnly
                      className={`${inputCls} opacity-60 cursor-not-allowed`}
                      placeholder="Managed by Category"
                    />
                    <p className="font-mono text-[9px] text-muted mt-1">Managed by Category</p>
                  </div>
                  <div>
                    <label className={labelCls}>BIS Certification</label>
                    <input
                      value={parentValues.bisCertification || '—'}
                      readOnly
                      className={`${inputCls} opacity-60 cursor-not-allowed`}
                      placeholder="Managed by Category"
                    />
                    <p className="font-mono text-[9px] text-muted mt-1">Managed by Category</p>
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
                    <button type="button" onClick={addSpec} className="font-mono text-[10px] uppercase tracking-[0.12em] text-accent border border-accent/20 px-3 py-1.5 hover:border-accent hover:bg-accent/5 transition-all rounded-sm">
                      + Add Spec
                    </button>
                  </div>
                  {specs.map((spec) => (
                    <div key={spec.id} className="flex gap-4 items-center w-full">
                      <input value={spec.key} onChange={e => updateSpec(spec.id, 'key', e.target.value)} placeholder="Key (e.g. Bulb Qty)" className={`${inputCls} flex-1 !py-2.5`} />
                      <input value={spec.value} onChange={e => updateSpec(spec.id, 'value', e.target.value)} placeholder="Value (e.g. 6)" className={`${inputCls} flex-1 !py-2.5`} />
                      <button type="button" onClick={() => removeSpec(spec.id)} className="text-red-400 p-2 hover:bg-red-950/20 transition-colors rounded-sm" title="Remove spec">
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </CollapsibleCard>

              {/* === MARKETPLACE & SEO CARD === */}
              <CollapsibleCard
                id="seo"
                title="Marketplace &amp; SEO"
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
                  <div className="font-mono text-[9px] uppercase tracking-widest text-muted mb-3">Auto-detected on category or AI generation — edit to override</div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="relative">
                      <label className={labelCls}>Light Fixture Form</label>
                      <input
                        value={parentValues.amazonFixtureForm}
                        onChange={e => handleParentFieldChange('amazonFixtureForm', e.target.value)}
                        placeholder="e.g. Chandelier, Pendant"
                        className={inputCls}
                      />
                      {parentValues.amazonFixtureForm ? (
                        <span className="absolute right-3 top-[32px] font-mono text-[8px] uppercase tracking-widest bg-emerald-950/40 text-emerald-400 px-2 py-0.5 border border-emerald-500/30 rounded-sm">auto · set</span>
                      ) : (
                        <span className="absolute right-3 top-[32px] font-mono text-[8px] uppercase tracking-widest bg-surface-muted text-muted px-2 py-0.5 border border-border rounded-sm">auto · pending</span>
                      )}
                    </div>
                    <div className="relative">
                      <label className={labelCls}>Mounting Type</label>
                      <input
                        value={parentValues.amazonMountingType}
                        onChange={e => handleParentFieldChange('amazonMountingType', e.target.value)}
                        placeholder="e.g. Ceiling Mount, Wall Mount"
                        className={inputCls}
                      />
                      {parentValues.amazonMountingType ? (
                        <span className="absolute right-3 top-[32px] font-mono text-[8px] uppercase tracking-widest bg-emerald-950/40 text-emerald-400 px-2 py-0.5 border border-emerald-500/30 rounded-sm">auto · set</span>
                      ) : (
                        <span className="absolute right-3 top-[32px] font-mono text-[8px] uppercase tracking-widest bg-surface-muted text-muted px-2 py-0.5 border border-border rounded-sm">auto · pending</span>
                      )}
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
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/80 hover:bg-red-600 hover:text-white flex items-center justify-center text-[12px] transition-colors z-10"
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
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/80 hover:bg-red-600 hover:text-white flex items-center justify-center text-[12px] transition-colors z-10"
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
              {/* Header card for delete trigger / info */}
              <div className="premium-card p-6 flex justify-between items-center border border-border bg-surface/10 rounded">
                <div>
                  <h3 className="font-serif text-[20px] text-primary font-medium tracking-wide">
                    Variant overrides: {variants[activeTab].name || `Variant ${activeTab + 1}`}
                  </h3>
                  <p className="font-mono text-[9px] text-muted uppercase tracking-widest mt-1">Specify override values for this specific variant option</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsDirty(true);
                    removeVariant(activeTab);
                    setActiveTab('parent');
                  }}
                  className="font-mono text-[9px] uppercase tracking-[0.15em] text-rose-400 border border-rose-900/30 px-4 py-2 hover:bg-rose-950/20 transition-colors rounded"
                >
                  Delete Variant option
                </button>
              </div>

              {/* === CARD 1: Variant Basic Info === */}
              <CollapsibleCard
                id="v_basic"
                title="Variant Details"
                sub="Variant identifier name, override SKU and stock"
                number="1"
                done={isVarBasicComplete}
                isOpen={openSections.v_basic}
                onToggle={() => setOpenSections(prev => ({ ...prev, v_basic: !prev.v_basic }))}
              >
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
              </CollapsibleCard>

              {/* === CARD 2: Pricing Overrides === */}
              <CollapsibleCard
                id="v_pricing"
                title="Pricing Overrides"
                sub="MRP, D2C, and B2B pricing overrides"
                number="2"
                done={isVarPricingComplete}
                isOpen={openSections.v_pricing}
                onToggle={() => setOpenSections(prev => ({ ...prev, v_pricing: !prev.v_pricing }))}
              >
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
              </CollapsibleCard>

              {/* === CARD 3: Dimensions Overrides === */}
              <CollapsibleCard
                id="v_dimensions"
                title="Dimensions Overrides"
                sub="Shipping and actual display dimensions overrides"
                number="3"
                done={isVarDimensionsComplete}
                isOpen={openSections.v_dimensions}
                onToggle={() => setOpenSections(prev => ({ ...prev, v_dimensions: !prev.v_dimensions }))}
              >
                <div className="space-y-6">
                  <div>
                    <div className="font-mono text-[9px] uppercase tracking-widest text-accent mb-3">Shipping dimensions overrides</div>
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
                    <div className="font-mono text-[9px] uppercase tracking-widest text-accent mb-3">Display Dimensions ({dimensionUnit === 'CM' ? 'cm' : 'in'}) overrides</div>
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
                </div>
              </CollapsibleCard>

              {/* === CARD 4: Technical Specs === */}
              <CollapsibleCard
                id="v_specs"
                title="Technical Specifications"
                sub="Bulb type, material, style, and custom specification overrides"
                number="4"
                done={isVarSpecsComplete}
                isOpen={openSections.v_specs}
                onToggle={() => setOpenSections(prev => ({ ...prev, v_specs: !prev.v_specs }))}
              >
                <div className="space-y-6">
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

                  <div className="grid grid-cols-2 gap-6 pt-4 border-t border-border/40">
                    <div>
                      <label className={labelCls}>Power specification override</label>
                      <input
                        value={variants[activeTab].power}
                        onChange={e => updateVariantField(activeTab, 'power', e.target.value)}
                        placeholder={parentValues.power ? `Inherit (${parentValues.power})` : 'Inherit'}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Voltage specification override</label>
                      <input
                        value={variants[activeTab].voltage}
                        onChange={e => updateVariantField(activeTab, 'voltage', e.target.value)}
                        placeholder={parentValues.voltage ? `Inherit (${parentValues.voltage})` : 'Inherit'}
                        className={inputCls}
                      />
                    </div>
                  </div>

                  {/* Overrides: custom specs */}
                  <div className="pt-6 border-t border-border/40 space-y-4">
                    <div className="flex justify-between items-center">
                      <label className={labelCls}>Variant-specific specs overrides</label>
                      <button type="button" onClick={() => addVariantSpec(activeTab)} className="font-mono text-[10px] uppercase tracking-[0.12em] text-accent border border-accent/20 px-3 py-1.5 hover:border-accent hover:bg-accent/5 transition-all rounded-sm">
                        + Add Variant Spec
                      </button>
                    </div>
                    {variants[activeTab].specs.map((spec) => (
                      <div key={spec.id} className="flex gap-4 items-center w-full">
                        <input value={spec.key} onChange={e => updateVariantSpec(activeTab, spec.id, 'key', e.target.value)} placeholder="Key (e.g. Frame Color)" className={`${inputCls} flex-1 !py-2.5`} />
                        <input value={spec.value} onChange={e => updateVariantSpec(activeTab, spec.id, 'value', e.target.value)} placeholder="Value (e.g. Polished Chrome)" className={`${inputCls} flex-1 !py-2.5`} />
                        <button type="button" onClick={() => removeVariantSpec(activeTab, spec.id)} className="text-red-400 p-2 hover:bg-red-950/20 transition-colors rounded-sm" title="Remove spec">
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </CollapsibleCard>

              {/* === CARD 5: Marketplace & SEO Overrides === */}
              <CollapsibleCard
                id="v_platform"
                title="Marketplace &amp; SEO overrides"
                sub="Brand, warranty, and marketplace category overrides"
                number="5"
                done={isVarPlatformComplete}
                isOpen={openSections.v_platform}
                onToggle={() => setOpenSections(prev => ({ ...prev, v_platform: !prev.v_platform }))}
              >
                <div className="grid grid-cols-2 gap-6">
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
                    <CustomDropdown
                      value={variants[activeTab].googleProductCategory || ''}
                      options={GOOGLE_PRODUCT_CATEGORIES.map(cat => ({ value: cat, label: cat }))}
                      onChange={val => updateVariantField(activeTab, 'googleProductCategory', val)}
                      placeholder={`Inherit Parent (${parentValues.googleProductCategory || 'None'})`}
                    />
                  </div>
                </div>
              </CollapsibleCard>

              {/* === CARD 6: Variant Images === */}
              <CollapsibleCard
                id="v_images"
                title="Variant Images"
                sub="Upload custom standard and white-background images for this variant"
                number="6"
                done={isVarImagesComplete}
                isOpen={openSections.v_images}
                onToggle={() => setOpenSections(prev => ({ ...prev, v_images: !prev.v_images }))}
              >
                <div className="space-y-6">
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
                                const currentList = variants[activeTab].images.split(',').map(s => s.trim()).filter(Boolean);
                                const filtered = currentList.filter((_, i) => i !== idx);
                                updateVariantField(activeTab, 'images', filtered.join(', '));
                              }}
                              className="absolute top-2 right-2 bg-red-600/90 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              title="Remove image"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                            <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => moveVariantImage(activeTab, idx, 'left', false)}
                                className="bg-black/75 hover:bg-accent text-white hover:text-black p-1 rounded font-mono text-[9px] cursor-pointer"
                                title="Move Left"
                              >
                                ◀
                              </button>
                              <button
                                type="button"
                                onClick={() => moveVariantImage(activeTab, idx, 'right', false)}
                                className="bg-black/75 hover:bg-accent text-white hover:text-black p-1 rounded font-mono text-[9px] cursor-pointer"
                                title="Move Right"
                              >
                                ▶
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="font-mono text-[10px] text-muted italic">No custom remastered images uploaded. (Inheriting from parent)</p>
                    )}

                    <div className="max-w-[400px]">
                      <CloudinaryUpload 
                        onUpload={(urls) => {
                          setIsDirty(true);
                          const existing = variants[activeTab].images ? variants[activeTab].images.split(',').map(s => s.trim()).filter(Boolean) : [];
                          updateVariantField(activeTab, 'images', [...existing, ...urls].join(', '));
                        }}
                        defaultImages={[]}
                        multiple={true}
                        label="Upload Variant Remastered Images"
                      />
                    </div>
                  </div>

                  {/* Variant White Background Images */}
                  <div className="pt-6 border-t border-border/40 space-y-4">
                    <h4 className="font-serif text-[16px] text-accent tracking-wide">Variant White Background Images</h4>
                    <p className="font-mono text-[10px] text-muted">Variant-specific white background catalog images (inherits parent if left blank).</p>
                    
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
                                const currentList = variants[activeTab].whiteBackgroundImages.split(',').map(s => s.trim()).filter(Boolean);
                                const filtered = currentList.filter((_, i) => i !== idx);
                                updateVariantField(activeTab, 'whiteBackgroundImages', filtered.join(', '));
                              }}
                              className="absolute top-2 right-2 bg-red-600/90 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              title="Remove image"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                            <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => moveVariantImage(activeTab, idx, 'left', true)}
                                className="bg-black/75 hover:bg-accent text-white hover:text-black p-1 rounded font-mono text-[9px] cursor-pointer"
                                title="Move Left"
                              >
                                ◀
                              </button>
                              <button
                                type="button"
                                onClick={() => moveVariantImage(activeTab, idx, 'right', true)}
                                className="bg-black/75 hover:bg-accent text-white hover:text-black p-1 rounded font-mono text-[9px] cursor-pointer"
                                title="Move Right"
                              >
                                ▶
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="font-mono text-[10px] text-muted italic">No custom white-background images uploaded. (Inheriting from parent)</p>
                    )}

                    <div className="max-w-[400px]">
                      <CloudinaryUpload
                        onUpload={(urls) => {
                          setIsDirty(true);
                          const existing = variants[activeTab].whiteBackgroundImages ? variants[activeTab].whiteBackgroundImages.split(',').map(s => s.trim()).filter(Boolean) : [];
                          updateVariantField(activeTab, 'whiteBackgroundImages', [...existing, ...urls].join(', '));
                        }}
                        defaultImages={[]}
                        multiple={true}
                        label="Upload Variant White Background Images"
                      />
                    </div>
                  </div>
                </div>
              </CollapsibleCard>
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
              {mode === 'edit' && defaultValues?.slug && (
                <a
                  href={`${process.env.NEXT_PUBLIC_STOREFRONT_URL || 'http://localhost:3001'}/products/${defaultValues.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 font-mono text-[9px] uppercase tracking-[0.15em] text-emerald-400 border border-emerald-400/30 bg-transparent hover:bg-emerald-400/10 hover:border-emerald-400 transition-colors flex items-center gap-1"
                >
                  View Listing ↗
                </a>
              )}
            </div>
          </div>
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
