import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import * as XLSX from 'xlsx';
import { getBrowseNode, getFixtureForm, getStyle, getMaterial, generateKeywords, generateKeywordsList, getInstallationLocation, getMountingType, getFinishType, getLightingMethod, getWaterResistanceLevel, getItemTypeName, generateDefaultBullets } from '@/lib/sync/mapping';

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
  // Brand Name (Col 9 - Col I)
  writeCell(sheet, rowIdx, 9, "James & Sons");

  // Part Number (Col 60 - Col BH) - Must be identical to SKU
  writeCell(sheet, rowIdx, 60, sku);

  // Model Number (Col 17)
  writeCell(sheet, rowIdx, 17, sku);
  
  // Model Name (Col 18)
  writeCell(sheet, rowIdx, 18, name);
  
  // Manufacturer (Col 19)
  writeCell(sheet, rowIdx, 19, "James & Sons");

  // External Product Information Entity & Value (Col 30 & 31)
  writeCell(sheet, rowIdx, 30, "9405");
  writeCell(sheet, rowIdx, 31, "HSN Code");

  // Style (Col 48)
  writeCell(sheet, rowIdx, 48, getStyle(v ? { ...p, style: v.style || p.style } : p));
  
  // Material (Col 49)
  writeCell(sheet, rowIdx, 49, getMaterial(v ? { ...p, materialAndFinish: v.material || p.materialAndFinish } : p));

  // Number of Items (Col 54)
  writeCell(sheet, rowIdx, 54, 1);
  
  // Item Type Name (Col 55)
  writeCell(sheet, rowIdx, 55, getItemTypeName(p));

  // Water Resistance Level (Col 56 - Col BD) - Must be official dropdown value
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

  // Power Source Type (Col 77 - Col BY)
  writeCell(sheet, rowIdx, 77, "Corded Electric");

  // Lighting Method (Col 79)
  writeCell(sheet, rowIdx, 79, getLightingMethod(p));

  // Voltage & Voltage Unit (Col 87 - Col CI & Col 88 - Col CJ)
  const voltVal = extractNumber(v ? v.voltage || p.voltage : p.voltage) || 220;
  writeCell(sheet, rowIdx, 87, voltVal);
  writeCell(sheet, rowIdx, 88, "Volts");

  // Mounting Type (Col 93)
  writeCell(sheet, rowIdx, 93, getMountingType(p));

  // Finish Type (Col 94)
  writeCell(sheet, rowIdx, 94, getFinishType(v ? { ...p, materialAndFinish: v.material || p.materialAndFinish } : p));

  // Unit Count & Unit Count Type (Col 97 - Col CS & Col 98 - Col CT)
  writeCell(sheet, rowIdx, 97, 1);
  writeCell(sheet, rowIdx, 98, "Count");

  // Included Components (Col 100)
  writeCell(sheet, rowIdx, 100, p.amazonIncludedComponents || "1 Pendant Light, Hanging Accessories, Wire");

  // Specific Uses for Product (Col 105)
  writeCell(sheet, rowIdx, 105, "Ambient Lighting");

  // Bulb Base (Col 127)
  writeCell(sheet, rowIdx, 127, "E12");

  // External Product Information Entity & Value (Col 142 & 143)
  writeCell(sheet, rowIdx, 142, "HSN Code");
  writeCell(sheet, rowIdx, 143, "9405");

  // Room Type (Col 151-155)
  const roomNames = (spaces || []).map((s: any) => s.name);
  if (roomNames.length === 0) {
    roomNames.push("Living Room", "Dining Room");
  }
  roomNames.slice(0, 5).forEach((rn, idx) => {
    writeCell(sheet, rowIdx, 151 + idx, rn);
  });

  // Shade Material (Col 164)
  writeCell(sheet, rowIdx, 164, "Fabric");

  // Number of Light Sources (Col 167)
  writeCell(sheet, rowIdx, 167, 1);

  // Importer Contact Information (Col 172)
  writeCell(sheet, rowIdx, 172, "James & Sons, CNI Church Compound, Civil Lines, Aligarh, Uttar Pradesh, 202001, India");

  // Packer Contact Information (Col 177)
  writeCell(sheet, rowIdx, 177, "James & Sons, CNI Church Compound, Civil Lines, Aligarh, Uttar Pradesh, 202001, India");

  // Indoor Outdoor Usage (Col 183)
  writeCell(sheet, rowIdx, 183, "Indoor");

  // Light Fixture Installation Location (Col 241)
  writeCell(sheet, rowIdx, 241, getInstallationLocation(p));

  // Item Condition (Col 244 - Col IJ)
  writeCell(sheet, rowIdx, 244, "New");

  // B2B Pricing
  writeCell(sheet, rowIdx, 283, price); // Your Price INR (B2B)
  writeCell(sheet, rowIdx, 284, mrp); // Maximum Retail Price (B2B)
  writeCell(sheet, rowIdx, 289, "Percent"); // Quantity Price Type (B2B)
  writeCell(sheet, rowIdx, 290, 5); // Quantity Threshold 1
  writeCell(sheet, rowIdx, 291, 5); // Quantity Price 1 (Percent Discount)

  // Number of Boxes (Col 317)
  writeCell(sheet, rowIdx, 317, 1);

  // Are Batteries Required? (Col 324)
  writeCell(sheet, rowIdx, 324, "No");

  // Dangerous Goods Regulations (Col 350)
  writeCell(sheet, rowIdx, 350, "Not Applicable");

  // Manufacturer's Email or Electronic Address (Col 396)
  writeCell(sheet, rowIdx, 396, "sales@jamesandsons.com");
}

export async function GET(req: NextRequest) {
  console.log('[Amazon Export] GET request initiated (using SheetJS)');
  try {
    // 1. Fetch products with their variants from DB
    console.log('[Amazon Export] Stage 1: Querying database...');
    const products = await prisma.product.findMany({
      include: { 
        variants: true,
        category: true,
        spaces: true
      },
      orderBy: { name: 'asc' }
    });
    console.log(`[Amazon Export] Successfully retrieved ${products.length} products.`);

    // 2. Resolve and Load template xlsm
    console.log('[Amazon Export] Stage 2: Locating template file...');
    let templatePath = path.join(process.cwd(), 'public', 'LAMP_LIGHT_FIXTURE.xlsm');
    
    if (!fs.existsSync(templatePath)) {
      console.warn(`[Amazon Export] Template not found in public folder: ${templatePath}`);
      const rootPath = path.join(process.cwd(), 'LAMP_LIGHT_FIXTURE.xlsm');
      if (fs.existsSync(rootPath)) {
        templatePath = rootPath;
      } else {
        const parentPath = path.resolve(process.cwd(), '..', 'LAMP_LIGHT_FIXTURE.xlsm');
        if (fs.existsSync(parentPath)) {
          templatePath = parentPath;
        } else {
          throw new Error('Template file LAMP_LIGHT_FIXTURE.xlsm not found on server.');
        }
      }
    }

    console.log(`[Amazon Export] Reading workbook file into buffer from: ${templatePath}`);
    const fileBytes = fs.readFileSync(templatePath);
    console.log(`[Amazon Export] File read successfully. Size: ${fileBytes.length} bytes. Parsing in SheetJS...`);

    const workbook = XLSX.read(fileBytes, { type: 'buffer', bookVBA: true });
    console.log('[Amazon Export] Workbook parsed successfully by SheetJS.');
    
    const sheet = workbook.Sheets['Template'];
    if (!sheet) {
      throw new Error("Worksheet 'Template' not found in the workbook");
    }

    // 3. Clear old data starting from Row 8
    console.log('[Amazon Export] Stage 3: Clearing old data from Template sheet...');
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
      const pBullets = (p.bulletPoints && Array.isArray(p.bulletPoints) && p.bulletPoints.length >= 3) ? p.bulletPoints : generateDefaultBullets(p);
      const pImages = p.images || [];

      // Write Parent row if variants exist
      if (hasVariants) {
        writeCell(sheet, rowIdx, 1, p.sku); // SKU
        writeCell(sheet, rowIdx, 2, "LIGHT_FIXTURE"); // Product Type
        writeCell(sheet, rowIdx, 3, "Create or Replace (Full Update)"); // Listing Action
        writeCell(sheet, rowIdx, 4, "Parent"); // Parentage Level
        writeCell(sheet, rowIdx, 6, "SIZE"); // Col F - Variation Theme Name
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

        // Browse Node & Keywords (Cols 38-42: AL, AM, AN, AO, AP)
        writeCell(sheet, rowIdx, 12, getBrowseNode(p)); // Recommended Browse Node
        const pKwList = generateKeywordsList(p);
        pKwList.forEach((kw, idx) => {
          writeCell(sheet, rowIdx, 38 + idx, kw);
        });
        writeCell(sheet, rowIdx, 90, getFixtureForm(p)); // Light Fixture Form

        // Images (Main: Col 22 V, Other 1-8: Cols 23-30 W-AD)
        if (pImages.length > 0) {
          writeCell(sheet, rowIdx, 22, pImages[0]);
          pImages.slice(1, 9).forEach((img, idx) => {
            writeCell(sheet, rowIdx, 23 + idx, img); // Cols 23 to 30 (W to AD)
          });
        }
        writeCell(sheet, rowIdx, 32, pDesc); // Product Description

        // Bullets (Cols 33-37: AG, AH, AI, AJ, AK)
        pBullets.slice(0, 5).forEach((b, idx) => {
          writeCell(sheet, rowIdx, 33 + idx, b);
        });

        // Shade Height & Width (Cols 162, 163, 165, 166)
        if ((p as any).shadeHeight) {
          writeCell(sheet, rowIdx, 162, (p as any).shadeHeight);
          writeCell(sheet, rowIdx, 163, "Centimeters");
        }
        if ((p as any).shadeWidth) {
          writeCell(sheet, rowIdx, 165, (p as any).shadeWidth);
          writeCell(sheet, rowIdx, 166, "Centimeters");
        }

        // Wattage
        const pWatt = extractNumber(p.power);
        if (pWatt !== null) {
          writeCell(sheet, rowIdx, 83, pWatt);
          writeCell(sheet, rowIdx, 84, "Watts");
        }

        // Voltage
        const pVolt = extractNumber(p.voltage);
        if (pVolt !== null) {
          writeCell(sheet, rowIdx, 85, pVolt);
          writeCell(sheet, rowIdx, 86, "Volts");
        }

        writeCell(sheet, rowIdx, 318, pOrigin || "India"); // Col LF - Country of Origin

        rowIdx++;

        // Write Children rows
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
          writeCell(sheet, rowIdx, 6, "SIZE"); // Col F - Variation Theme Name
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

          // Browse Node & Keywords (Cols 38-42: AL, AM, AN, AO, AP)
          writeCell(sheet, rowIdx, 12, getBrowseNode(p)); // Recommended Browse Node
          const vKwList = generateKeywordsList(p);
          vKwList.forEach((kw, idx) => {
            writeCell(sheet, rowIdx, 38 + idx, kw);
          });
          writeCell(sheet, rowIdx, 90, getFixtureForm(p)); // Light Fixture Form

          // Images (Main: Col 22 V, Other 1-8: Cols 23-30 W-AD)
          if (vImages.length > 0) {
            writeCell(sheet, rowIdx, 22, vImages[0]);
            vImages.slice(1, 9).forEach((img, idx) => {
              writeCell(sheet, rowIdx, 23 + idx, img); // Cols 23 to 30 (W to AD)
            });
          }
          writeCell(sheet, rowIdx, 32, pDesc); // Product Description

          // Bullets (Cols 33-37: AG, AH, AI, AJ, AK)
          vBullets.slice(0, 5).forEach((b, idx) => {
            writeCell(sheet, rowIdx, 33 + idx, b);
          });

          // Shade Height & Width (Cols 162, 163, 165, 166)
          const vShadeH = (v as any).shadeHeight || (p as any).shadeHeight;
          const vShadeW = (v as any).shadeWidth || (p as any).shadeWidth;
          if (vShadeH) {
            writeCell(sheet, rowIdx, 162, vShadeH);
            writeCell(sheet, rowIdx, 163, "Centimeters");
          }
          if (vShadeW) {
            writeCell(sheet, rowIdx, 165, vShadeW);
            writeCell(sheet, rowIdx, 166, "Centimeters");
          }

          if (vMaterial) {
            writeCell(sheet, rowIdx, 49, vMaterial); // Material
          }

          if (vWatt !== null) {
            writeCell(sheet, rowIdx, 83, vWatt);
            writeCell(sheet, rowIdx, 84, "Watts");
          }
          if (vVolt !== null) {
            writeCell(sheet, rowIdx, 85, vVolt);
            writeCell(sheet, rowIdx, 86, "Volts");
          }

          // Actual Product Weight & Dimensions (HU, HV, HW, HX, HY, HZ)
          const actHeight = v.actualHeight || p.actualHeight || 53;
          const actLength = v.actualDepth || p.actualDepth || (v as any).length || p.length || 15;
          const actWidth = v.actualWidth || p.actualWidth || 20;

          writeCell(sheet, rowIdx, 229, actHeight); // Col HU
          writeCell(sheet, rowIdx, 230, "Centimeters"); // Col HV
          writeCell(sheet, rowIdx, 231, actLength); // Col HW
          writeCell(sheet, rowIdx, 232, "Centimeters"); // Col HX
          writeCell(sheet, rowIdx, 233, actWidth); // Col HY
          writeCell(sheet, rowIdx, 234, "Centimeters"); // Col HZ

          writeCell(sheet, rowIdx, 197, vWeight); // Item Weight
          writeCell(sheet, rowIdx, 198, "Kilograms"); // Item Weight Unit

          // Package Dimensions & Weight
          writeCell(sheet, rowIdx, 307, vLength); // Item Package Length
          writeCell(sheet, rowIdx, 308, "Centimeters");
          writeCell(sheet, rowIdx, 309, vWidth); // Item Package Width
          writeCell(sheet, rowIdx, 310, "Centimeters");
          writeCell(sheet, rowIdx, 311, vHeight); // Item Package Height
          writeCell(sheet, rowIdx, 312, "Centimeters");
          writeCell(sheet, rowIdx, 313, vWeight); // Package Weight
          writeCell(sheet, rowIdx, 314, "Kilograms");

          const vMinPrice = v.b2bPrice || p.b2bPrice || Math.round(vPrice * 0.85);
          const vMaxPrice = vMrp || Math.round(vPrice * 1.30);

          writeCell(sheet, rowIdx, 268, "DEFAULT"); // Col JH (Fulfillment Channel Code)
          writeCell(sheet, rowIdx, 269, vStock); // Quantity (IN)
          writeCell(sheet, rowIdx, 270, 5); // Handling Time
          writeCell(sheet, rowIdx, 273, vPrice); // Your Price INR
          writeCell(sheet, rowIdx, 274, vMrp); // Maximum Retail Price
          writeCell(sheet, rowIdx, 275, "No Price Rule"); // Col JO (Pricing Rule)
          writeCell(sheet, rowIdx, 276, vMinPrice); // Minimum Seller Allowed Price
          writeCell(sheet, rowIdx, 277, vMaxPrice); // Maximum Seller Allowed Price
          writeCell(sheet, rowIdx, 300, "Migrated Template"); // Col KN - Shipping Template
          writeCell(sheet, rowIdx, 318, vOrigin || pOrigin || "India"); // Col LF - Country of Origin

          rowIdx++;
        }
      } else {
        // Single product with no variants
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

        // Browse Node & Keywords (Cols 38-42: AL, AM, AN, AO, AP)
        writeCell(sheet, rowIdx, 12, getBrowseNode(p)); // Recommended Browse Node
        const sKwList = generateKeywordsList(p);
        sKwList.forEach((kw, idx) => {
          writeCell(sheet, rowIdx, 38 + idx, kw);
        });
        writeCell(sheet, rowIdx, 90, getFixtureForm(p)); // Light Fixture Form

        // Images (Main: Col 22 V, Other 1-8: Cols 23-30 W-AD)
        if (pImages.length > 0) {
          writeCell(sheet, rowIdx, 22, pImages[0]);
          pImages.slice(1, 9).forEach((img, idx) => {
            writeCell(sheet, rowIdx, 23 + idx, img); // Cols 23 to 30 (W to AD)
          });
        }
        writeCell(sheet, rowIdx, 32, pDesc); // Product Description

        // Bullets (Cols 33-37: AG, AH, AI, AJ, AK)
        pBullets.slice(0, 5).forEach((b, idx) => {
          writeCell(sheet, rowIdx, 33 + idx, b);
        });

        // Shade Height & Width (Cols 162, 163, 165, 166)
        if ((p as any).shadeHeight) {
          writeCell(sheet, rowIdx, 162, (p as any).shadeHeight);
          writeCell(sheet, rowIdx, 163, "Centimeters");
        }
        if ((p as any).shadeWidth) {
          writeCell(sheet, rowIdx, 165, (p as any).shadeWidth);
          writeCell(sheet, rowIdx, 166, "Centimeters");
        }

        if (pMaterial) {
          writeCell(sheet, rowIdx, 49, pMaterial); // Material
        }

        if (pWatt !== null) {
          writeCell(sheet, rowIdx, 83, pWatt);
          writeCell(sheet, rowIdx, 84, "Watts");
        }
        if (pVolt !== null) {
          writeCell(sheet, rowIdx, 85, pVolt);
          writeCell(sheet, rowIdx, 86, "Volts");
        }

        // Actual Product Weight & Dimensions (HU, HV, HW, HX, HY, HZ)
        const actHeight = p.actualHeight || 53;
        const actLength = p.actualDepth || p.length || 15;
        const actWidth = p.actualWidth || 20;

        writeCell(sheet, rowIdx, 229, actHeight); // Col HU
        writeCell(sheet, rowIdx, 230, "Centimeters"); // Col HV
        writeCell(sheet, rowIdx, 231, actLength); // Col HW
        writeCell(sheet, rowIdx, 232, "Centimeters"); // Col HX
        writeCell(sheet, rowIdx, 233, actWidth); // Col HY
        writeCell(sheet, rowIdx, 234, "Centimeters"); // Col HZ

        writeCell(sheet, rowIdx, 197, pWeight); // Item Weight
        writeCell(sheet, rowIdx, 198, "Kilograms"); // Item Weight Unit

        // Package Dimensions & Weight
        writeCell(sheet, rowIdx, 307, pLength); // Item Package Length
        writeCell(sheet, rowIdx, 308, "Centimeters");
        writeCell(sheet, rowIdx, 309, pWidth); // Item Package Width
        writeCell(sheet, rowIdx, 310, "Centimeters");
        writeCell(sheet, rowIdx, 311, pHeight); // Item Package Height
        writeCell(sheet, rowIdx, 312, "Centimeters");
        writeCell(sheet, rowIdx, 313, pWeight); // Package Weight
        writeCell(sheet, rowIdx, 314, "Kilograms");

        const pMinPrice = p.b2bPrice || Math.round(pPrice * 0.85);
        const pMaxPrice = pMrp || Math.round(pPrice * 1.30);

        writeCell(sheet, rowIdx, 268, "DEFAULT"); // Col JH (Fulfillment Channel Code)
        writeCell(sheet, rowIdx, 269, pStock); // Quantity (IN)
        writeCell(sheet, rowIdx, 270, 5); // Handling Time
        writeCell(sheet, rowIdx, 273, pPrice); // Your Price INR
        writeCell(sheet, rowIdx, 274, pMrp); // Maximum Retail Price
        writeCell(sheet, rowIdx, 275, "No Price Rule"); // Col JO (Pricing Rule)
        writeCell(sheet, rowIdx, 276, pMinPrice); // Minimum Seller Allowed Price
        writeCell(sheet, rowIdx, 277, pMaxPrice); // Maximum Seller Allowed Price
        writeCell(sheet, rowIdx, 300, "Migrated Template"); // Col KN - Shipping Template
        writeCell(sheet, rowIdx, 318, pOrigin || "India"); // Col LF - Country of Origin

        rowIdx++;
      }
    }

    // Update sheet dimensions (!ref) to include our new rows
    console.log('[Amazon Export] Stage 4: Updating sheet range bounds...');
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
    console.log(`[Amazon Export] Bounds updated to: ${sheet['!ref']}`);

    // Remove all instruction sheets, keeping ONLY 'Template' sheet
    console.log('[Amazon Export] Trimming workbook sheets to only include the Template sheet...');
    workbook.SheetNames = ['Template'];
    workbook.Sheets = { 'Template': sheet };

    // 4. Write populated workbook into buffer using SheetJS
    console.log('[Amazon Export] Writing SheetJS workbook buffer...');
    const fileBuffer = XLSX.write(workbook, {
      bookType: 'xlsm',
      type: 'buffer',
      bookVBA: true // Important: preserves VBA macros!
    });
    
    const uint8Array = new Uint8Array(fileBuffer);
    console.log(`[Amazon Export] Workbook buffer generated. Size: ${uint8Array.byteLength} bytes.`);

    // 5. Send back as binary attachment
    console.log('[Amazon Export] Stage 5: Sending Response...');
    return new Response(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.ms-excel.sheet.macroEnabled.12',
        'Content-Disposition': 'attachment; filename="amazon_listing_feed.xlsm"',
        'Content-Length': uint8Array.byteLength.toString()
      }
    });

  } catch (error: any) {
    console.error('[Amazon Export] CRITICAL FAILURE:', error);
    if (error && error.stack) {
      console.error('[Amazon Export] Stack trace:', error.stack);
    }
    return NextResponse.json({ 
      error: error.message || 'Export failed',
      stack: error.stack || 'No stack trace available'
    }, { status: 500 });
  }
}
