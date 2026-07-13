import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import ExcelJS from 'exceljs';

function extractNumber(text: any): number | null {
  if (text === null || text === undefined) return null;
  const match = String(text).match(/[-+]?\d*\.\d+|\d+/);
  if (match) {
    const val = parseFloat(match[0]);
    return isNaN(val) ? null : val;
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    // 1. Fetch products with their variants from DB
    const products = await prisma.product.findMany({
      include: { variants: true },
      orderBy: { name: 'asc' }
    });

    // 2. Load template xlsm (using exceljs)
    const templatePath = path.join(process.cwd(), 'public', 'LAMP_LIGHT_FIXTURE.xlsm');
    
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);
    
    const sheet = workbook.getWorksheet('Template');
    if (!sheet) {
      throw new Error("Worksheet 'Template' not found in the workbook");
    }

    // Clear any old data starting from Row 8
    const lastRow = sheet.rowCount;
    if (lastRow >= 8) {
      for (let r = 8; r <= lastRow; r++) {
        const row = sheet.getRow(r);
        for (let c = 1; c <= 418; c++) {
          row.getCell(c).value = null;
        }
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

      // Write Parent row if variants exist
      if (hasVariants) {
        const parentRow = sheet.getRow(rowIdx);

        parentRow.getCell(1).value = p.sku; // SKU
        parentRow.getCell(2).value = "LIGHT_FIXTURE"; // Product Type
        parentRow.getCell(3).value = "Create or Replace (Full Update)"; // Listing Action
        parentRow.getCell(4).value = "Parent"; // Parentage Level
        parentRow.getCell(6).value = "Size/Color"; // Variation Theme Name
        parentRow.getCell(7).value = p.name; // Item Name
        parentRow.getCell(9).value = pBrand; // Brand Name

        // Images
        if (pImages.length > 0) {
          parentRow.getCell(22).value = pImages[0];
          pImages.slice(1, 9).forEach((img, idx) => {
            parentRow.getCell(23 + idx).value = img;
          });
        }
        parentRow.getCell(32).value = pDesc; // Product Description

        // Bullets
        pBullets.slice(0, 5).forEach((b, idx) => {
          parentRow.getCell(33 + idx).value = b;
        });

        if (pMaterial) {
          parentRow.getCell(49).value = pMaterial; // Material
        }

        // Wattage
        const pWatt = extractNumber(p.power);
        if (pWatt !== null) {
          parentRow.getCell(83).value = pWatt;
          parentRow.getCell(84).value = "Watts";
        }

        // Voltage
        const pVolt = extractNumber(p.voltage);
        if (pVolt !== null) {
          parentRow.getCell(85).value = pVolt;
          parentRow.getCell(86).value = "Volts";
        }

        parentRow.getCell(312).value = pOrigin; // Country of Origin

        rowIdx++;

        // Write Children rows
        for (const v of variants) {
          const childRow = sheet.getRow(rowIdx);

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

          childRow.getCell(1).value = vSku; // SKU
          childRow.getCell(2).value = "LIGHT_FIXTURE"; // Product Type
          childRow.getCell(3).value = "Create or Replace (Full Update)"; // Listing Action
          childRow.getCell(4).value = "Child"; // Parentage Level
          childRow.getCell(5).value = p.sku; // Parent SKU
          childRow.getCell(6).value = "Size/Color"; // Variation Theme Name
          childRow.getCell(7).value = `${p.name} - ${v.name}`; // Item Name
          childRow.getCell(9).value = vBrand; // Brand Name
          childRow.getCell(10).value = "SellerSKU"; // Product Id Type
          childRow.getCell(11).value = vSku; // Product Id

          // Images
          if (vImages.length > 0) {
            childRow.getCell(22).value = vImages[0];
            vImages.slice(1, 9).forEach((img, idx) => {
              childRow.getCell(23 + idx).value = img;
            });
          }
          childRow.getCell(32).value = pDesc; // Product Description

          // Bullets
          vBullets.slice(0, 5).forEach((b, idx) => {
            childRow.getCell(33 + idx).value = b;
          });

          if (vMaterial) {
            childRow.getCell(49).value = vMaterial; // Material
          }

          if (vWatt !== null) {
            childRow.getCell(83).value = vWatt;
            childRow.getCell(84).value = "Watts";
          }
          if (vVolt !== null) {
            childRow.getCell(85).value = vVolt;
            childRow.getCell(86).value = "Volts";
          }

          // Weight
          childRow.getCell(197).value = vWeight;
          childRow.getCell(198).value = "kg";

          // Dimensions
          childRow.getCell(229).value = vHeight;
          childRow.getCell(230).value = "cm";
          childRow.getCell(231).value = vLength;
          childRow.getCell(232).value = "cm";
          childRow.getCell(233).value = vWidth;
          childRow.getCell(234).value = "cm";

          childRow.getCell(269).value = vStock; // Quantity (IN)
          childRow.getCell(273).value = vPrice; // Your Price INR
          childRow.getCell(274).value = vMrp; // Maximum Retail Price
          childRow.getCell(312).value = vOrigin; // Country of Origin

          rowIdx++;
        }
      } else {
        // Single product with no variants
        const singleRow = sheet.getRow(rowIdx);

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

        singleRow.getCell(1).value = pSku; // SKU
        singleRow.getCell(2).value = "LIGHT_FIXTURE"; // Product Type
        singleRow.getCell(3).value = "Create or Replace (Full Update)"; // Listing Action
        singleRow.getCell(4).value = null; // Parentage Level
        singleRow.getCell(7).value = p.name; // Item Name
        singleRow.getCell(9).value = pBrand; // Brand Name
        singleRow.getCell(10).value = "SellerSKU"; // Product Id Type
        singleRow.getCell(11).value = pSku; // Product Id

        // Images
        if (pImages.length > 0) {
          singleRow.getCell(22).value = pImages[0];
          pImages.slice(1, 9).forEach((img, idx) => {
            singleRow.getCell(23 + idx).value = img;
          });
        }
        singleRow.getCell(32).value = pDesc; // Product Description

        // Bullets
        pBullets.slice(0, 5).forEach((b, idx) => {
          singleRow.getCell(33 + idx).value = b;
        });

        if (pMaterial) {
          singleRow.getCell(49).value = pMaterial; // Material
        }

        if (pWatt !== null) {
          singleRow.getCell(83).value = pWatt;
          singleRow.getCell(84).value = "Watts";
        }
        if (pVolt !== null) {
          singleRow.getCell(85).value = pVolt;
          singleRow.getCell(86).value = "Volts";
        }

        // Weight
        singleRow.getCell(197).value = pWeight;
        singleRow.getCell(198).value = "kg";

        // Dimensions
        singleRow.getCell(229).value = pHeight;
        singleRow.getCell(230).value = "cm";
        singleRow.getCell(231).value = pLength;
        singleRow.getCell(232).value = "cm";
        singleRow.getCell(233).value = pWidth;
        singleRow.getCell(234).value = "cm";

        singleRow.getCell(269).value = pStock; // Quantity (IN)
        singleRow.getCell(273).value = pPrice; // Your Price INR
        singleRow.getCell(274).value = pMrp; // Maximum Retail Price
        singleRow.getCell(312).value = pOrigin; // Country of Origin

        rowIdx++;
      }
    }

    // 3. Write populated workbook into buffer
    const fileBuffer = await workbook.xlsx.writeBuffer();

    // 4. Send back as binary attachment
    return new Response(fileBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.ms-excel.sheet.macroEnabled.12',
        'Content-Disposition': 'attachment; filename="amazon_listing_feed.xlsm"'
      }
    });

  } catch (error: any) {
    console.error('Amazon Excel export failed:', error);
    return NextResponse.json({ error: error.message || 'Export failed' }, { status: 500 });
  }
}
