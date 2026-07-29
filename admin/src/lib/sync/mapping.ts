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
  const form = product?.amazonFixtureForm;
  if (form && form.toLowerCase() !== 'light_fixture') {
    return form;
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
  if (cat.includes('wall') || cat.includes('sconce') || t.includes('wall') || t.includes('sconce') || t.includes('bracket')) {
    return 'Sconce';
  }
  if (t.includes('gate') || t.includes('pole') || t.includes('post') || t.includes('bollard')) {
    return 'Path';
  }
  return 'Ceiling';
}

export function generateDefaultBullets(product: any): string[] {
  if (product?.bulletPoints && Array.isArray(product.bulletPoints) && product.bulletPoints.length >= 3) {
    return product.bulletPoints.slice(0, 5);
  }

  // Extract bullets from description if available
  if (product?.description && typeof product.description === 'string') {
    const rawDesc = product.description.replace(/<[^>]*>/g, ' ');
    const lines = rawDesc
      .split(/\n|•|;|\||- /)
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 15 && line.length < 250);

    if (lines.length >= 3) {
      return lines.slice(0, 5);
    }
  }

  const name = product.name || 'Luxury Lighting Fixture';
  const mat = getMaterial(product);
  const finish = getFinishType(product);
  const watt = product.power || 'Max 60W';
  const volt = product.voltage || '220V AC';
  
  const h = product.actualHeight || product.height || 53;
  const l = product.actualDepth || product.actualLength || product.length || 15;
  const w = product.actualWidth || product.breadth || 20;

  const spacesStr = (product.spaces && Array.isArray(product.spaces) && product.spaces.length > 0)
    ? product.spaces.map((s: any) => s.name).join(', ')
    : 'living rooms, bedrooms, hallways, dining areas, hotels, cafes, and decorative spaces';

  return [
    `ELEGANT DESIGN & PREMIUM BUILD: ${name} features a classic design crafted with high-grade ${mat} and a ${finish} finish for long-lasting durability and timeless aesthetic appeal.`,
    `SOFT & WARM ILLUMINATION: Designed with a high-quality shade that diffuses light evenly, providing a soft, ambient glow to create a warm and welcoming atmosphere.`,
    `UNIVERSAL BULB COMPATIBILITY: Features a standard E27 bulb holder compatible with LED, CFL, and incandescent bulbs (${watt}, ${volt}). Bulb not included.`,
    `VERSATILE INTERIOR APPLICATION: Perfect for enhancing ${spacesStr}, adding a touch of luxury and sophistication to residential and commercial environments.`,
    `COMPACT PRODUCT DIMENSIONS: Measures ${h} cm in height, ${l} cm in length, and ${w} cm in breadth for a space-efficient lighting solution with simple wall/ceiling installation.`
  ];
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

export function generateKeywordsList(product: any): string[] {
  const mat = getMaterial(product);
  const style = getStyle(product);
  const cat = product?.category?.name || 'Lighting';

  const baseKeywords = generateKeywords(product);
  
  const cluster1 = `${baseKeywords}`.substring(0, 245);
  const cluster2 = `${style} ${mat} ${cat} fixture indoor decorative home lighting`.substring(0, 245);
  const cluster3 = `handcrafted luxury brass metal wall lamp pendant chandelier sconce`.substring(0, 245);
  const cluster4 = `living room bedroom hallway bedside dining room hotel cafe decor`.substring(0, 245);
  const cluster5 = `e27 holder warm light ambient illumination modern aesthetic accent`.substring(0, 245);

  return [cluster1, cluster2, cluster3, cluster4, cluster5];
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
  const val = String(product?.amazonWaterResistance || '').toLowerCase();
  if (val.includes('waterproof')) return 'Waterproof';
  if (val.includes('repellent')) return 'Water Repellent';
  if (val.includes('moisture')) return 'Moisture Resistant';
  if (val.includes('resistant') && !val.includes('not')) return 'Water Resistant';
  return 'Not Water Resistant';
}

export function getItemTypeName(product: any): string {
  const node = getBrowseNode(product);
  if (node === '1380491031') return 'Chandeliers';
  if (node === '1380493031') return 'Pendant Lights';
  return 'Ceiling Lights';
}
