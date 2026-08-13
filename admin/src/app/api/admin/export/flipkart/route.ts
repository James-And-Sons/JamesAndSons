import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import * as XLSX from "xlsx";
import { BRAND_CONFIG } from "@james-andsons/config";
import { getStyle, getMaterial, getMountingType } from "@/lib/sync/mapping";

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
  let type = "s";
  if (typeof value === "number") type = "n";
  else if (typeof value === "boolean") type = "b";

  sheet[cellRef] = { t: type, v: value };
}

function getFlipkartTypeAndMount(categoryName: string, productName: string) {
  const cat = (categoryName || "").toLowerCase();
  const name = (productName || "").toLowerCase();

  if (cat.includes("chandelier") || name.includes("chandelier")) {
    return {
      type: "Chandelier",
      mountType: "Hanging",
      suitableFor: "Living Room::Dining Room",
      usage: "Decorative",
    };
  }
  if (
    cat.includes("hanging") ||
    cat.includes("pendant") ||
    name.includes("hanging") ||
    name.includes("pendant")
  ) {
    return {
      type: "Pendant",
      mountType: "Hanging",
      suitableFor: "Accent Light::Decorative Light",
      usage: "Decorative",
    };
  }
  if (cat.includes("table") || name.includes("table")) {
    return {
      type: "Table",
      mountType: "Table",
      suitableFor: "Bedside Lamp::Study Lamp",
      usage: "Decorative",
    };
  }
  if (cat.includes("floor") || name.includes("floor")) {
    return {
      type: "Floor",
      mountType: "Floor",
      suitableFor: "Living Room::Reading Lamp",
      usage: "Decorative",
    };
  }
  if (
    cat.includes("pole") ||
    cat.includes("gate") ||
    name.includes("pole") ||
    name.includes("gate") ||
    name.includes("post")
  ) {
    return {
      type: "Gate Lamp",
      mountType: "Post Mount",
      suitableFor: "Outdoor Light::Gate Light",
      usage: "Functional",
    };
  }
  return {
    type: "Sconce",
    mountType: "Wall Mounted",
    suitableFor: "Wall Light::Accent Light",
    usage: "Decorative",
  };
}

function writeRowAttributes(
  sheet: any,
  rowIdx: number,
  p: any, // parent product
  sku: string,
  name: string,
  brand: string,
  color: string,
  size: string,
  v: any = null, // variant if exists
) {
  const categoryName = p.category?.name || "";
  const mapping = getFlipkartTypeAndMount(categoryName, name);

  // Col 7 (G): Seller SKU ID
  writeCell(sheet, rowIdx, 7, sku);

  // Col 8 (H): Group ID (group variants together by parent sku)
  writeCell(sheet, rowIdx, 8, p.sku);

  // Col 9 (I): Brand
  writeCell(sheet, rowIdx, 9, brand);

  // Col 10 (J): Mount Type
  writeCell(sheet, rowIdx, 10, mapping.mountType);

  // Col 11 (K): Material
  writeCell(
    sheet,
    rowIdx,
    11,
    getMaterial(
      v ? { ...p, materialAndFinish: v.material || p.materialAndFinish } : p,
    ),
  );

  // Col 12 (L): Bulb Included
  writeCell(sheet, rowIdx, 12, "Yes");

  // Col 13 (M): Suitable For
  writeCell(sheet, rowIdx, 13, mapping.suitableFor);

  // Col 14 (N): Adjustable
  writeCell(sheet, rowIdx, 14, "No");

  // Col 15 (O): Model Number
  writeCell(sheet, rowIdx, 15, sku);

  // Col 16 (P): Brand Color
  writeCell(sheet, rowIdx, 16, color);

  // Col 17 (Q): Type
  writeCell(sheet, rowIdx, 17, mapping.type);

  // Col 18 (R): Pack of Lamps
  writeCell(sheet, rowIdx, 18, 1);

  // Col 19 (S): Color
  writeCell(sheet, rowIdx, 19, color);

  // Col 20 (T): Bulb Used
  writeCell(sheet, rowIdx, 20, "LED");

  // Col 21 (U): Width
  const wNum = extractNumber(v ? v.breadth || p.breadth : p.breadth) || 12;
  writeCell(sheet, rowIdx, 21, wNum);

  // Col 22 (V): Width - Measuring Unit
  writeCell(sheet, rowIdx, 22, "[cm]");

  // Col 23 (W): Height
  const hNum = extractNumber(v ? v.height || p.height : p.height) || 12;
  writeCell(sheet, rowIdx, 23, hNum);

  // Col 24 (X): Height - Measuring Unit
  writeCell(sheet, rowIdx, 24, "[cm]");

  // Col 25 (Y): Items Included
  writeCell(sheet, rowIdx, 25, "1 Lamp, Hanging/Fitting Accessories");

  // Col 26 (Z): Pack of
  writeCell(sheet, rowIdx, 26, 1);

  // Images (Col 27-31)
  const images = (v ? v.images : p.images) || [];
  writeCell(sheet, rowIdx, 27, images[0] || "");
  writeCell(sheet, rowIdx, 28, images[1] || "");
  writeCell(sheet, rowIdx, 29, images[2] || "");
  writeCell(sheet, rowIdx, 30, images[3] || "");
  writeCell(sheet, rowIdx, 31, images[4] || "");

  // Col 32 (AF): Weight
  const wtNum = extractNumber(v ? v.weight || p.weight : p.weight) || 0.5;
  writeCell(sheet, rowIdx, 32, wtNum);

  // Col 33 (AG): Weight - Measuring Unit
  writeCell(sheet, rowIdx, 33, "[kg]");

  // Col 34 (AH): Description
  writeCell(sheet, rowIdx, 34, p.description || p.name);

  // Col 35 (AI): Search Keywords
  writeCell(sheet, rowIdx, 35, `${p.name}::Decorative Light::Lamp`);

  // Col 36-39 (AJ-AM): Key Specs
  writeCell(sheet, rowIdx, 36, "Premium Finish");
  writeCell(sheet, rowIdx, 37, "Durable Quality");
  writeCell(sheet, rowIdx, 38, "Easy Installation");
  writeCell(sheet, rowIdx, 39, "Elegant Look");

  // Col 40 (AN): Key Features
  writeCell(sheet, rowIdx, 40, "Made in India::Handcrafted");

  // Col 42 (AP): Finish
  const finish = v ? v.finish || p.finish || "Gold" : p.finish || "Gold";
  writeCell(sheet, rowIdx, 42, finish);

  // Col 43 (AQ): Sensor Present
  writeCell(sheet, rowIdx, 43, "No");

  // Col 44 (AR): Style
  writeCell(sheet, rowIdx, 44, getStyle(v ? { ...p, ...v } : p));

  // Col 45 (AS): Lamp Shape
  writeCell(sheet, rowIdx, 45, "Round");

  // Col 46 (AT): Maximum Wattage
  const wattNum = extractNumber(v ? v.power || p.power : p.power) || 40;
  writeCell(sheet, rowIdx, 46, wattNum);

  // Col 47 (AU): Maximum Wattage - Measuring Unit
  writeCell(sheet, rowIdx, 47, "[W]");

  // Col 48 (AV): Cord Length
  writeCell(sheet, rowIdx, 48, 30);

  // Col 49 (AW): Cord Length - Measuring Unit
  writeCell(sheet, rowIdx, 49, "[cm]");

  // Col 54 (BB): Domestic Warranty
  writeCell(sheet, rowIdx, 54, 12);

  // Col 55 (BC): Domestic Warranty - Measuring Unit
  writeCell(sheet, rowIdx, 55, "[Month]");

  // Col 58 (BF): Warranty Summary
  writeCell(
    sheet,
    rowIdx,
    58,
    "12 Months Warranty against Manufacturing Defects",
  );

  // Col 59 (BG): Warranty Service Type
  writeCell(
    sheet,
    rowIdx,
    59,
    `Please contact support email: ${BRAND_CONFIG.supportEmail}`,
  );

  // Col 60 (BH): Covered in Warranty
  writeCell(sheet, rowIdx, 60, "Manufacturing defects");

  // Col 61 (BI): Not Covered in Warranty
  writeCell(sheet, rowIdx, 61, "Physical damage or improper handling");

  // Col 62 (BJ): Holder Type
  writeCell(sheet, rowIdx, 62, "E27");

  // Col 63 (BK): Light Color
  writeCell(sheet, rowIdx, 63, "Warm White");

  // Col 65 (BM): Control Method
  writeCell(sheet, rowIdx, 65, "Wall Switch");

  // Col 66 (BN): Usage
  writeCell(sheet, rowIdx, 66, mapping.usage);

  // Col 67 (BO): Gift Pack
  writeCell(sheet, rowIdx, 67, "No");
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "all"; // 'unlisted' | 'all'
    const listedSkus = new Set(["JW06", "JW01", "JTF02"]);

    const allProducts = await prisma.product.findMany({
      include: {
        variants: true,
        category: true,
      },
      orderBy: { name: "asc" },
    });

    const products =
      filter === "unlisted"
        ? allProducts.filter((p) => {
            const skus =
              p.variants && p.variants.length > 0
                ? p.variants.map((v) => v.sku)
                : [p.sku];
            return skus.some((s) => s && !listedSkus.has(s));
          })
        : allProducts;

    let templatePath = "";
    const localPath = path.resolve(
      process.cwd(),
      "FLIPKART_WALL_LAMP_TEMPLATE.xls",
    );
    const rootPath = path.resolve(
      process.cwd(),
      "admin",
      "FLIPKART_WALL_LAMP_TEMPLATE.xls",
    );

    if (fs.existsSync(localPath)) {
      templatePath = localPath;
    } else if (fs.existsSync(rootPath)) {
      templatePath = rootPath;
    } else {
      const parentPath = path.resolve(
        process.cwd(),
        "..",
        "admin",
        "FLIPKART_WALL_LAMP_TEMPLATE.xls",
      );
      if (fs.existsSync(parentPath)) {
        templatePath = parentPath;
      } else {
        throw new Error(
          "Template file FLIPKART_WALL_LAMP_TEMPLATE.xls not found on server.",
        );
      }
    }

    console.log(`[Flipkart Export] Reading template from: ${templatePath}`);
    const fileBytes = fs.readFileSync(templatePath);
    const workbook = XLSX.read(fileBytes, { type: "buffer" });
    const sheet = workbook.Sheets["Parent Variant Products"];
    if (!sheet) {
      throw new Error(
        "Worksheet 'Parent Variant Products' not found in the workbook",
      );
    }

    // Clear old data starting from Row 5
    for (const key of Object.keys(sheet)) {
      if (key.startsWith("!")) continue;
      const cell = XLSX.utils.decode_cell(key);
      if (cell.r >= 4) {
        delete sheet[key];
      }
    }

    let rowIdx = 5;
    const brandName = BRAND_CONFIG.name || "James and Sons";

    for (const p of products) {
      const variants = p.variants || [];
      const hasVariants = variants.length > 0;

      if (hasVariants) {
        for (const v of variants) {
          writeRowAttributes(
            sheet,
            rowIdx,
            p,
            v.sku,
            `${p.name} - ${v.name}`,
            brandName,
            v.color || "Gold",
            v.size || "Standard",
            v,
          );
          rowIdx++;
        }
      } else {
        writeRowAttributes(
          sheet,
          rowIdx,
          p,
          p.sku,
          p.name,
          brandName,
          p.color || "Gold",
          p.size || "Standard",
          null,
        );
        rowIdx++;
      }
    }

    // Update bounds
    let maxRow = 5;
    let maxCol = 1;
    for (const key of Object.keys(sheet)) {
      if (key.startsWith("!")) continue;
      const cell = XLSX.utils.decode_cell(key);
      if (cell.r + 1 > maxRow) maxRow = cell.r + 1;
      if (cell.c + 1 > maxCol) maxCol = cell.c + 1;
    }
    sheet["!ref"] = XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: maxRow - 1, c: Math.max(maxCol - 1, 67) },
    });

    console.log(`[Flipkart Export] Writing populated xls workbook...`);
    const fileBuffer = XLSX.write(workbook, {
      bookType: "xls",
      type: "buffer",
    });

    const uint8Array = new Uint8Array(fileBuffer);
    return new Response(uint8Array, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.ms-excel",
        "Content-Disposition":
          'attachment; filename="flipkart_listing_feed.xls"',
        "Content-Length": uint8Array.byteLength.toString(),
      },
    });
  } catch (error: any) {
    console.error("[Flipkart Export] CRITICAL FAILURE:", error);
    return NextResponse.json(
      {
        error: error.message || "Export failed",
      },
      { status: 500 },
    );
  }
}
