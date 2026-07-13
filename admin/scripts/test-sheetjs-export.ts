import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

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

async function run() {
  try {
    const { prisma } = await import('../src/lib/prisma');

    console.log('Querying database for products...');
    const products = await prisma.product.findMany({
      include: { variants: true },
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
        writeCell(sheet, rowIdx, 9, pBrand); // Brand Name

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

        if (pMaterial) {
          writeCell(sheet, rowIdx, 49, pMaterial); // Material
        }

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
          writeCell(sheet, rowIdx, 9, vBrand); // Brand Name
          writeCell(sheet, rowIdx, 10, "SellerSKU"); // Product Id Type
          writeCell(sheet, rowIdx, 11, vSku); // Product Id

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

          writeCell(sheet, rowIdx, 197, vWeight);
          writeCell(sheet, rowIdx, 198, "kg");

          writeCell(sheet, rowIdx, 229, vHeight);
          writeCell(sheet, rowIdx, 230, "cm");
          writeCell(sheet, rowIdx, 231, vLength);
          writeCell(sheet, rowIdx, 232, "cm");
          writeCell(sheet, rowIdx, 233, vWidth);
          writeCell(sheet, rowIdx, 234, "cm");

          writeCell(sheet, rowIdx, 269, vStock); // Quantity (IN)
          writeCell(sheet, rowIdx, 273, vPrice); // Your Price INR
          writeCell(sheet, rowIdx, 274, vMrp); // Maximum Retail Price
          writeCell(sheet, rowIdx, 312, vOrigin); // Country of Origin

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
        writeCell(sheet, rowIdx, 9, pBrand); // Brand Name
        writeCell(sheet, rowIdx, 10, "SellerSKU"); // Product Id Type
        writeCell(sheet, rowIdx, 11, pSku); // Product Id

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

        writeCell(sheet, rowIdx, 197, pWeight);
        writeCell(sheet, rowIdx, 198, "kg");

        writeCell(sheet, rowIdx, 229, pHeight);
        writeCell(sheet, rowIdx, 230, "cm");
        writeCell(sheet, rowIdx, 231, pLength);
        writeCell(sheet, rowIdx, 232, "cm");
        writeCell(sheet, rowIdx, 233, pWidth);
        writeCell(sheet, rowIdx, 234, "cm");

        writeCell(sheet, rowIdx, 269, pStock); // Quantity (IN)
        writeCell(sheet, rowIdx, 273, pPrice); // Your Price INR
        writeCell(sheet, rowIdx, 274, pMrp); // Maximum Retail Price
        writeCell(sheet, rowIdx, 312, pOrigin); // Country of Origin

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
    console.log('Trimming workbook to only contain the Template sheet...');
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
