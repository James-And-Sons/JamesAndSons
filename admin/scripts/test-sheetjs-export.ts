import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { getBrowseNode, getFixtureForm, getStyle, getMaterial, generateKeywords, getInstallationLocation, getMountingType, getFinishType, getLightingMethod, getWaterResistanceLevel, getItemTypeName } from '../src/lib/sync/mapping';

// Load env variables manually from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  console.log('Loading .env.local...');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)\s*$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  }
}

function extractNumber(text: any): number | null {
  if (text === null || text === undefined) return null;
  const match = String(text).match(/[-+]?\d*\.\d+|\d+/);
  if (match) {
    const val = parseFloat(match[0]);
    return isNaN(val) ? null : val;
  }
  return null;
}

function writeCell(sheet: any, row: number, col: number, value: any) {
  const cellRef = XLSX.utils.encode_cell({ r: row - 1, c: col - 1 });
  if (value === null || value === undefined) {
    delete sheet[cellRef];
    return;
  }
  let type = 's';
  if (typeof value === 'number') type = 'n';
  else if (typeof value === 'boolean') type = 'b';
  
  sheet[cellRef] = { t: type, v: value };
}

function writeRowAttributes(
  sheet: any,
  rowIdx: number,
  p: any,             // parent product
  sku: string,
  name: string,
  brand: string,
  price: number,
  mrp: number,
  color: string,
  size: string,
  spaces: any[],
  v: any = null       // variant if exists
) {
  // Brand Name (Col 9)
  writeCell(sheet, rowIdx, 9, "James & Sons, Aligarh");
  
  // Model Number (Col 17)
  writeCell(sheet, rowIdx, 17, sku);
  
  // Model Name (Col 18)
  writeCell(sheet, rowIdx, 18, name);
  
  // Manufacturer (Col 19)
  writeCell(sheet, rowIdx, 19, "James & Sons");

  // Style (Col 48)
  writeCell(sheet, rowIdx, 48, getStyle(v ? { ...p, style: v.style || p.style } : p));
  
  // Material (Col 49)
  writeCell(sheet, rowIdx, 49, getMaterial(v ? { ...p, materialAndFinish: v.material || p.materialAndFinish } : p));

  // Number of Items (Col 54)
  writeCell(sheet, rowIdx, 54, 1);
  
  // Item Type Name (Col 55)
  writeCell(sheet, rowIdx, 55, getItemTypeName(p));

  // Water Resistance Level (Col 56)
  writeCell(sheet, rowIdx, 56, getWaterResistanceLevel(p));

  // Color (Col 57)
  writeCell(sheet, rowIdx, 57, color);

  // Size (Col 58)
  writeCell(sheet, rowIdx, 58, size);

  // Number of Pieces (Col 59)
  writeCell(sheet, rowIdx, 59, 1);

  // Theme (Col 63)
  writeCell(sheet, rowIdx, 63, p.amazonTheme || getStyle(p));

  // Manufacturer Contact Information (Col 68)
  writeCell(sheet, rowIdx, 68, "James & Sons, CNI Church Compound, Civil Lines, Aligarh, Uttar Pradesh, 202001, India");

  // Lighting Method (Col 79)
  writeCell(sheet, rowIdx, 79, getLightingMethod(p));

  // Mounting Type (Col 93)
  writeCell(sheet, rowIdx, 93, getMountingType(p));

  // Finish Type (Col 94)
  writeCell(sheet, rowIdx, 94, getFinishType(v ? { ...p, materialAndFinish: v.material || p.materialAndFinish } : p));

  // Included Components (Col 100)
  writeCell(sheet, rowIdx, 100, p.amazonIncludedComponents || "1 Pendant Light, Hanging Accessories, Wire");

  // Specific Uses for Product (Col 105)
  writeCell(sheet, rowIdx, 105, "Ambient Lighting");

  // Bulb Base (Col 127)
  writeCell(sheet, rowIdx, 127, "E12");

  // Room Type (Col 151-155)
  const roomNames = (spaces || []).map((s: any) => s.name);
  if (roomNames.length === 0) {
    roomNames.push("Living Room", "Dining Room");
  }
  roomNames.slice(0, 5).forEach((rn, idx) => {
    writeCell(sheet, rowIdx, 151 + idx, rn);
  });

  // Light Fixture Installation Location (Col 241)
  writeCell(sheet, rowIdx, 241, getInstallationLocation(p));

  // B2B Pricing
  writeCell(sheet, rowIdx, 283, price); // Your Price INR (B2B)
  writeCell(sheet, rowIdx, 284, mrp); // Maximum Retail Price (B2B)
  writeCell(sheet, rowIdx, 289, "Percent"); // Quantity Price Type (B2B)
  writeCell(sheet, rowIdx, 290, 5); // Quantity Threshold 1
  writeCell(sheet, rowIdx, 291, 5); // Quantity Price 1 (Percent Discount)

  // Manufacturer's Email or Electronic Address (Col 396)
  writeCell(sheet, rowIdx, 396, "sales@jamesandsons.com");
}

async function run() {
  try {
    const { prisma } = await import('../src/lib/prisma');

    console.log('Querying database for products...');
    const products = await prisma.product.findMany({
      include: { 
        variants: true,
        category: true,
        spaces: true
      },
      orderBy: { name: 'asc' }
    });
    console.log(`Successfully retrieved ${products.length} products.`);

    const templatePath = path.join(__dirname, '..', 'public', 'LAMP_LIGHT_FIXTURE.xlsm');
    console.log(`Reading template workbook from: ${templatePath}`);
    
    const fileBytes = fs.readFileSync(templatePath);
    const workbook = XLSX.read(fileBytes, { type: 'buffer', bookVBA: true });
    console.log('Workbook parsed successfully by SheetJS.');
    
    const sheet = workbook.Sheets['Template'];
    if (!sheet) {
      throw new Error("Worksheet 'Template' not found in the workbook");
    }

    console.log('Clearing old data from Template sheet...');
    for (const key of Object.keys(sheet)) {
      if (key.startsWith('!')) continue;
      const cell = XLSX.utils.decode_cell(key);
      if (cell.r >= 7) {
        delete sheet[key];
      }
    }

    let rowIdx = 8;

    for (const p of products) {
      const variants = p.variants || [];
      const hasVariants = variants.length > 0;
      const pBrand = p.brand || "James and Sons";
      const pDesc = p.description || p.name;
      const pMaterial = p.material || (p.materialAndFinish && p.materialAndFinish.length > 0 ? p.materialAndFinish[0] : null);
      const pOrigin = p.countryOfOrigin || "India";
      const pBullets = p.bulletPoints || [];
      const pImages = p.images || [];

      if (hasVariants) {
        writeCell(sheet, rowIdx, 1, p.sku); // SKU
        writeCell(sheet, rowIdx, 2, "LIGHT_FIXTURE"); // Product Type
        writeCell(sheet, rowIdx, 3, "Create or Replace (Full Update)"); // Listing Action
        writeCell(sheet, rowIdx, 4, "Parent"); // Parentage Level
        writeCell(sheet, rowIdx, 6, "Size/Color"); // Variation Theme Name
        writeCell(sheet, rowIdx, 7, p.name); // Item Name

        // Standardized and expanded attributes
        writeRowAttributes(
          sheet,
          rowIdx,
          p,
          p.sku,
          p.name,
          pBrand,
          p.d2cPrice,
          p.mrp,
          p.color || "Standard",
          p.size || "Standard",
          p.spaces || [],
          null
        );

        // Browse Node & Keywords
        writeCell(sheet, rowIdx, 12, getBrowseNode(p)); // Recommended Browse Node
        writeCell(sheet, rowIdx, 38, generateKeywords(p)); // Generic Keywords
        writeCell(sheet, rowIdx, 90, getFixtureForm(p)); // Light Fixture Form

        if (pImages.length > 0) {
          writeCell(sheet, rowIdx, 22, pImages[0]);
          pImages.slice(1, 9).forEach((img, idx) => {
            writeCell(sheet, rowIdx, 23 + idx, img);
          });
        }
        writeCell(sheet, rowIdx, 32, pDesc); // Product Description

        pBullets.slice(0, 5).forEach((b, idx) => {
          writeCell(sheet, rowIdx, 33 + idx, b);
        });

        const pWatt = extractNumber(p.power);
        if (pWatt !== null) {
          writeCell(sheet, rowIdx, 83, pWatt);
          writeCell(sheet, rowIdx, 84, "Watts");
        }

        const pVolt = extractNumber(p.voltage);
        if (pVolt !== null) {
          writeCell(sheet, rowIdx, 85, pVolt);
          writeCell(sheet, rowIdx, 86, "Volts");
        }

        writeCell(sheet, rowIdx, 312, pOrigin); // Country of Origin

        rowIdx++;

        for (const v of variants) {
          const vSku = v.sku;
          const vPrice = v.d2cPrice || p.d2cPrice;
          const vMrp = v.mrp || p.mrp;
          const vStock = v.stockQuantity || 0;
          const vImages = (v.images && v.images.length > 0) ? v.images : pImages;
          const vWeight = v.weight || p.weight || 0.5;
          const vLength = v.length || p.length || 10.0;
          const vWidth = v.breadth || p.breadth || 10.0;
          const vHeight = v.height || p.height || 10.0;
          const vWatt = extractNumber(v.power || p.power);
          const vVolt = extractNumber(v.voltage || p.voltage);
          const vMaterial = v.material || pMaterial;
          const vOrigin = v.countryOfOrigin || pOrigin;
          const vBrand = v.brand || pBrand;
          const vBullets = (v.bulletPoints && v.bulletPoints.length > 0) ? v.bulletPoints : pBullets;

          writeCell(sheet, rowIdx, 1, vSku); // SKU
          writeCell(sheet, rowIdx, 2, "LIGHT_FIXTURE"); // Product Type
          writeCell(sheet, rowIdx, 3, "Create or Replace (Full Update)"); // Listing Action
          writeCell(sheet, rowIdx, 4, "Child"); // Parentage Level
          writeCell(sheet, rowIdx, 5, p.sku); // Parent SKU
          writeCell(sheet, rowIdx, 6, "Size/Color"); // Variation Theme Name
          writeCell(sheet, rowIdx, 7, `${p.name} - ${v.name}`); // Item Name
          writeCell(sheet, rowIdx, 10, "SellerSKU"); // Product Id Type
          writeCell(sheet, rowIdx, 11, vSku); // Product Id

          // Standardized and expanded attributes
          writeRowAttributes(
            sheet,
            rowIdx,
            p,
            vSku,
            `${p.name} - ${v.name}`,
            vBrand,
            vPrice,
            vMrp,
            v.color || "Standard",
            v.size || "Standard",
            p.spaces || [],
            v
          );

          // Browse Node & Keywords
          writeCell(sheet, rowIdx, 12, getBrowseNode(p)); // Recommended Browse Node
          writeCell(sheet, rowIdx, 38, generateKeywords(p)); // Generic Keywords
          writeCell(sheet, rowIdx, 90, getFixtureForm(p)); // Light Fixture Form

          if (vImages.length > 0) {
            writeCell(sheet, rowIdx, 22, vImages[0]);
            vImages.slice(1, 9).forEach((img, idx) => {
              writeCell(sheet, rowIdx, 23 + idx, img);
            });
          }
          writeCell(sheet, rowIdx, 32, pDesc); // Product Description

          vBullets.slice(0, 5).forEach((b, idx) => {
            writeCell(sheet, rowIdx, 33 + idx, b);
          });

          if (vWatt !== null) {
            writeCell(sheet, rowIdx, 83, vWatt);
            writeCell(sheet, rowIdx, 84, "Watts");
          }
          if (vVolt !== null) {
            writeCell(sheet, rowIdx, 85, vVolt);
            writeCell(sheet, rowIdx, 86, "Volts");
          }

          // Actual Product Weight & Dimensions
          const actHeight = v.actualHeight || p.actualHeight;
          const actLength = v.actualWidth || p.actualWidth;
          const actWidth = v.actualDepth || p.actualDepth;

          writeCell(sheet, rowIdx, 197, vWeight); // Item Weight
          writeCell(sheet, rowIdx, 198, "kg");

          if (actHeight) {
            writeCell(sheet, rowIdx, 229, actHeight);
            writeCell(sheet, rowIdx, 230, "cm");
          }
          if (actLength) {
            writeCell(sheet, rowIdx, 231, actLength);
            writeCell(sheet, rowIdx, 232, "cm");
          }
          if (actWidth) {
            writeCell(sheet, rowIdx, 233, actWidth);
            writeCell(sheet, rowIdx, 234, "cm");
          }

          // Package Dimensions & Weight
          writeCell(sheet, rowIdx, 301, vLength); // Item Package Length
          writeCell(sheet, rowIdx, 302, "Centimetres");
          writeCell(sheet, rowIdx, 303, vWidth); // Item Package Width
          writeCell(sheet, rowIdx, 304, "Centimetres");
          writeCell(sheet, rowIdx, 305, vHeight); // Item Package Height
          writeCell(sheet, rowIdx, 306, "Centimetres");
          writeCell(sheet, rowIdx, 307, vWeight); // Package Weight
          writeCell(sheet, rowIdx, 308, "Kilograms");

          writeCell(sheet, rowIdx, 269, vStock); // Quantity (IN)
          writeCell(sheet, rowIdx, 273, vPrice); // Your Price INR
          writeCell(sheet, rowIdx, 274, vMrp); // Maximum Retail Price
          writeCell(sheet, rowIdx, 312, vOrigin); // Country of Origin // Country of Origin

          rowIdx++;
        }
      } else {
        const pSku = p.sku;
        const pPrice = p.d2cPrice;
        const pMrp = p.mrp;
        const pStock = p.stockQuantity || 0;
        const pWatt = extractNumber(p.power);
        const pVolt = extractNumber(p.voltage);
        const pWeight = p.weight || 0.5;
        const pLength = p.length || 10.0;
        const pWidth = p.breadth || 10.0;
        const pHeight = p.height || 10.0;

        writeCell(sheet, rowIdx, 1, pSku); // SKU
        writeCell(sheet, rowIdx, 2, "LIGHT_FIXTURE"); // Product Type
        writeCell(sheet, rowIdx, 3, "Create or Replace (Full Update)"); // Listing Action
        writeCell(sheet, rowIdx, 4, null); // Parentage Level
        writeCell(sheet, rowIdx, 7, p.name); // Item Name
        writeCell(sheet, rowIdx, 10, "SellerSKU"); // Product Id Type
        writeCell(sheet, rowIdx, 11, pSku); // Product Id

        // Standardized and expanded attributes
        writeRowAttributes(
          sheet,
          rowIdx,
          p,
          pSku,
          p.name,
          pBrand,
          pPrice,
          pMrp,
          p.color || "Standard",
          p.size || "Standard",
          p.spaces || [],
          null
        );

        // Browse Node & Keywords
        writeCell(sheet, rowIdx, 12, getBrowseNode(p)); // Recommended Browse Node
        writeCell(sheet, rowIdx, 38, generateKeywords(p)); // Generic Keywords
        writeCell(sheet, rowIdx, 90, getFixtureForm(p)); // Light Fixture Form

        if (pImages.length > 0) {
          writeCell(sheet, rowIdx, 22, pImages[0]);
          pImages.slice(1, 9).forEach((img, idx) => {
            writeCell(sheet, rowIdx, 23 + idx, img);
          });
        }
        writeCell(sheet, rowIdx, 32, pDesc); // Product Description

        pBullets.slice(0, 5).forEach((b, idx) => {
          writeCell(sheet, rowIdx, 33 + idx, b);
        });

        if (pWatt !== null) {
          writeCell(sheet, rowIdx, 83, pWatt);
          writeCell(sheet, rowIdx, 84, "Watts");
        }
        if (pVolt !== null) {
          writeCell(sheet, rowIdx, 85, pVolt);
          writeCell(sheet, rowIdx, 86, "Volts");
        }

        // Actual Product Weight & Dimensions
        writeCell(sheet, rowIdx, 197, pWeight); // Item Weight
        writeCell(sheet, rowIdx, 198, "kg");

        if (p.actualHeight) {
          writeCell(sheet, rowIdx, 229, p.actualHeight);
          writeCell(sheet, rowIdx, 230, "cm");
        }
        if (p.actualWidth) {
          writeCell(sheet, rowIdx, 231, p.actualWidth);
          writeCell(sheet, rowIdx, 232, "cm");
        }
        if (p.actualDepth) {
          writeCell(sheet, rowIdx, 233, p.actualDepth);
          writeCell(sheet, rowIdx, 234, "cm");
        }

        // Package Dimensions & Weight
        writeCell(sheet, rowIdx, 301, pLength); // Item Package Length
        writeCell(sheet, rowIdx, 302, "Centimetres");
        writeCell(sheet, rowIdx, 303, pWidth); // Item Package Width
        writeCell(sheet, rowIdx, 304, "Centimetres");
        writeCell(sheet, rowIdx, 305, pHeight); // Item Package Height
        writeCell(sheet, rowIdx, 306, "Centimetres");
        writeCell(sheet, rowIdx, 307, pWeight); // Package Weight
        writeCell(sheet, rowIdx, 308, "Kilograms");

        writeCell(sheet, rowIdx, 269, pStock); // Quantity (IN)
        writeCell(sheet, rowIdx, 273, pPrice); // Your Price INR
        writeCell(sheet, rowIdx, 274, pMrp); // Maximum Retail Price
        writeCell(sheet, rowIdx, 312, pOrigin); // Country of Origin // Country of Origin

        rowIdx++;
      }
    }

    // Update sheet dimensions (!ref) to include our new rows
    let maxRow = 8;
    let maxCol = 1;
    for (const key of Object.keys(sheet)) {
      if (key.startsWith('!')) continue;
      const cell = XLSX.utils.decode_cell(key);
      if (cell.r + 1 > maxRow) maxRow = cell.r + 1;
      if (cell.c + 1 > maxCol) maxCol = cell.c + 1;
    }
    sheet['!ref'] = XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: maxRow - 1, c: Math.max(maxCol - 1, 418) }
    });
    console.log(`Updated sheet bounds to: ${sheet['!ref']}`);

    // Remove all instruction sheets, keeping ONLY 'Template' sheet
    workbook.SheetNames = ['Template'];
    workbook.Sheets = { 'Template': sheet };

    const outPath = path.join(__dirname, '..', '..', 'amazon_listing_feed.xlsm');
    console.log(`Writing test output to: ${outPath}`);
    
    const fileBuffer = XLSX.write(workbook, {
      bookType: 'xlsm',
      type: 'buffer',
      bookVBA: true
    });
    fs.writeFileSync(outPath, fileBuffer);
    console.log('Successfully generated populated test Excel file!');
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Local export failed:', error);
  }
}

run();
