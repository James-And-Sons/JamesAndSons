export function getBrowseNode(product: any): string {
  if (product?.amazonFixtureForm) {
    const form = product.amazonFixtureForm.toLowerCase();
    if (form === 'chandelier') return '1380491031';
    if (form === 'pendant') return '1380493031';
    if (form === 'ceiling') return '1380488031';
  }

  // Fallback to dynamic classification
  const cat = (product?.category?.name || '').toLowerCase();
  const t = (product?.name || '').toLowerCase();
  if (cat.includes('chandelier') || t.includes('chandelier')) {
    return '1380491031';
  }
  if (cat.includes('pendant') || cat.includes('hanging') || t.includes('pendant') || t.includes('hanging')) {
    return '1380493031';
  }
  return '1380488031';
}

export function getFixtureForm(product: any): string {
  if (product?.amazonFixtureForm) {
    return product.amazonFixtureForm;
  }

  // Fallback to dynamic classification
  const cat = (product?.category?.name || '').toLowerCase();
  const t = (product?.name || '').toLowerCase();
  if (cat.includes('chandelier') || t.includes('chandelier')) {
    return 'Chandelier';
  }
  if (cat.includes('pendant') || cat.includes('hanging') || t.includes('pendant') || t.includes('hanging')) {
    return 'Pendant';
  }
  return 'Ceiling';
}

export function getStyle(product: any): string {
  if (product?.amazonTheme) {
    return product.amazonTheme;
  }

  const dbStyles = product?.style;
  if (!dbStyles) return 'Modern';
  
  const stylesList: string[] = [];
  if (Array.isArray(dbStyles)) {
    stylesList.push(...dbStyles);
  } else if (typeof dbStyles === 'string') {
    stylesList.push(...dbStyles.split(/[,\s]+/));
  }

  const lowercaseStyles = stylesList.map(s => s.toLowerCase());

  for (const style of lowercaseStyles) {
    if (style.includes('antique') || style.includes('colonial') || style.includes('heritage')) {
      return 'Antique';
    }
    if (style.includes('art deco') || style.includes('deco')) {
      return 'Art Deco';
    }
    if (style.includes('bohemian') || style.includes('boho')) {
      return 'Bohemian';
    }
    if (style.includes('contemporary')) {
      return 'Contemporary';
    }
    if (style.includes('retro')) {
      return 'Retro';
    }
    if (style.includes('vintage')) {
      return 'Vintage';
    }
    if (style.includes('modern') || style.includes('minimalist') || style.includes('scandinavian')) {
      return 'Modern';
    }
  }

  return 'Modern';
}

export function getMaterial(product: any): string {
  const dbMaterials = product?.materialAndFinish;
  if (!dbMaterials) return 'Metal';

  const materialsList: string[] = [];
  if (Array.isArray(dbMaterials)) {
    materialsList.push(...dbMaterials);
  } else if (typeof dbMaterials === 'string') {
    materialsList.push(...dbMaterials.split(/[,\s]+/));
  }

  const lowercaseMats = materialsList.map(m => m.toLowerCase());

  for (const mat of lowercaseMats) {
    if (mat.includes('brass')) return 'Brass';
    if (mat.includes('bronze')) return 'Bronze';
    if (mat.includes('copper')) return 'Copper';
    if (mat.includes('glass')) return 'Glass';
    if (mat.includes('iron')) return 'Iron';
    if (mat.includes('wood')) return 'Wood';
    if (mat.includes('steel')) return 'Alloy Steel';
    if (mat.includes('aluminium') || mat.includes('aluminum')) return 'Aluminium';
    if (mat.includes('acrylic')) return 'Acrylic';
    if (mat.includes('metal')) return 'Metal';
  }

  return 'Metal';
}

export function getMountingType(product: any): string {
  if (product?.amazonMountingType) {
    return product.amazonMountingType;
  }
  const cat = (product?.category?.name || '').toLowerCase();
  if (cat.includes('wall') || cat.includes('sconce')) return 'Wall Mount';
  if (product?.name?.toLowerCase().includes('gate') || product?.name?.toLowerCase().includes('pole') || product?.name?.toLowerCase().includes('post')) return 'Post Mount';
  return 'Ceiling Mount';
}

export function getInstallationLocation(product: any): string {
  const loc = product?.amazonFixtureForm || '';
  const formLower = loc.toLowerCase();
  if (formLower === 'sconce') return 'Wall';
  
  const name = (product?.name || '').toLowerCase();
  if (name.includes('gate') || name.includes('pole') || name.includes('post') || name.includes('outdoor')) return 'Outdoor';
  const cat = (product?.category?.name || '').toLowerCase();
  if (cat.includes('wall') || cat.includes('sconce')) return 'Wall';
  return 'Ceiling';
}

export function generateKeywords(product: any): string {
  if (product?.amazonKeywords?.trim()) {
    return product.amazonKeywords.substring(0, 250);
  }

  const keywordsSet = new Set<string>();

  const addFilteredWords = (text: string) => {
    const words = String(text || '').toLowerCase().split(/[^a-zA-Z0-9]+/);
    const stopWords = new Set(['and', 'with', 'for', 'set', 'light', 'lamp', 'lights', 'lamps', 'fixture', 'fixtures', 'the', 'this', 'a', 'of', 'in', 'on', 'to']);
    words.forEach(w => {
      if (w.length > 2 && !stopWords.has(w)) {
        keywordsSet.add(w);
      }
    });
  };

  addFilteredWords(product.name);
  addFilteredWords(product.category?.name);

  if (product.spaces && Array.isArray(product.spaces)) {
    product.spaces.forEach((s: any) => {
      addFilteredWords(s.name);
    });
  }

  const stylesInput = product.style;
  const stylesList: string[] = [];
  if (Array.isArray(stylesInput)) {
    stylesList.push(...stylesInput);
  } else if (typeof stylesInput === 'string') {
    stylesList.push(...stylesInput.split(/[,\s]+/));
  }
  stylesList.forEach(s => {
    const sw = s.toLowerCase().trim();
    if (sw.length > 2 && sw !== 'light' && sw !== 'lamp') {
      keywordsSet.add(sw);
    }
  });

  keywordsSet.add('hanging');
  keywordsSet.add('ceiling');
  keywordsSet.add('indoor');
  keywordsSet.add('decor');

  const combined = Array.from(keywordsSet).join(' ');
  return combined.substring(0, 250);
}

export function getFinishType(product: any): string {
  const mat = String(product.materialAndFinish || '').toLowerCase();
  if (mat.includes('matte') || mat.includes('mat')) return 'Matte';
  if (mat.includes('polished') || mat.includes('polish')) return 'Polished';
  if (mat.includes('brushed') || mat.includes('brush')) return 'Brushed';
  if (mat.includes('antique') || mat.includes('vintage')) return 'Antique';
  if (mat.includes('powder coated')) return 'Powder Coated';
  if (mat.includes('chrome')) return 'Chrome';
  if (mat.includes('satin')) return 'Satin';
  return 'Matte';
}

export function getLightingMethod(product: any): string {
  if (product?.amazonLightingMethod) {
    return product.amazonLightingMethod;
  }
  return 'Downlight';
}

export function getWaterResistanceLevel(product: any): string {
  if (product?.amazonWaterResistance) {
    return product.amazonWaterResistance;
  }
  return 'Not Water Resistant';
}

export function getItemTypeName(product: any): string {
  const node = getBrowseNode(product);
  if (node === '1380491031') return 'Chandeliers';
  if (node === '1380493031') return 'Pendant Lights';
  return 'Ceiling Lights';
}
