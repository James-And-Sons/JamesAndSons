import * as XLSX from 'xlsx';

export function getBrowseNode(categoryName: string, title: string): string {
  const cat = (categoryName || '').toLowerCase();
  const t = (title || '').toLowerCase();
  if (cat.includes('chandelier') || t.includes('chandelier')) {
    return '1380491031'; // Home & Kitchen > Indoor Lighting > Ceiling Lighting > Chandeliers
  }
  if (cat.includes('pendant') || cat.includes('hanging') || t.includes('pendant') || t.includes('hanging')) {
    return '1380493031'; // Home & Kitchen > Indoor Lighting > Ceiling Lighting > Pendant Lights
  }
  return '1380488031'; // Home & Kitchen > Indoor Lighting > Fixtures
}

export function getFixtureForm(categoryName: string, title: string): string {
  const cat = (categoryName || '').toLowerCase();
  const t = (title || '').toLowerCase();
  if (cat.includes('chandelier') || t.includes('chandelier')) {
    return 'Chandelier';
  }
  if (cat.includes('pendant') || cat.includes('hanging') || t.includes('pendant') || t.includes('hanging')) {
    return 'Pendant';
  }
  return 'Ceiling';
}

export function getStyle(dbStyles: string[] | string | null | undefined): string {
  if (!dbStyles) return 'Modern';
  
  const stylesList: string[] = [];
  if (Array.isArray(dbStyles)) {
    stylesList.push(...dbStyles);
  } else if (typeof dbStyles === 'string') {
    // split by comma or spaces
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

  return 'Modern'; // Default style fallback
}

export function getMaterial(dbMaterials: string[] | string | null | undefined): string {
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

  return 'Metal'; // Default fallback
}

export function generateKeywords(product: any): string {
  const keywordsSet = new Set<string>();

  // Add words from title
  const titleWords = String(product.name || '').toLowerCase().split(/[^a-zA-Z0-9]+/);
  titleWords.forEach(w => {
    if (w.length > 2 && w !== 'and' && w !== 'with' && w !== 'for' && w !== 'set') {
      keywordsSet.add(w);
    }
  });

  // Add category name
  const catWords = String(product.category?.name || '').toLowerCase().split(/[^a-zA-Z0-9]+/);
  catWords.forEach(w => {
    if (w.length > 2 && w !== 'and') {
      keywordsSet.add(w);
    }
  });

  // Add spaces
  if (product.spaces && Array.isArray(product.spaces)) {
    product.spaces.forEach((s: any) => {
      const spaceWords = String(s.name || '').toLowerCase().split(/[^a-zA-Z0-9]+/);
      spaceWords.forEach(w => {
        if (w.length > 2 && w !== 'and') {
          keywordsSet.add(w);
        }
      });
    });
  }

  // Add styles
  const stylesInput = product.style;
  const stylesList: string[] = [];
  if (Array.isArray(stylesInput)) {
    stylesList.push(...stylesInput);
  } else if (typeof stylesInput === 'string') {
    stylesList.push(...stylesInput.split(/[,\s]+/));
  }
  stylesList.forEach(s => {
    const sw = s.toLowerCase().trim();
    if (sw.length > 2) {
      keywordsSet.add(sw);
    }
  });

  // Add static relevant words
  keywordsSet.add('hanging');
  keywordsSet.add('ceiling');
  keywordsSet.add('lights');
  keywordsSet.add('lamp');
  keywordsSet.add('fixture');

  // Join to single string up to 250 characters
  const combined = Array.from(keywordsSet).join(' ');
  return combined.substring(0, 250);
}
