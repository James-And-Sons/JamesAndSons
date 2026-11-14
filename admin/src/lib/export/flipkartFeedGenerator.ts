import * as XLSX from "xlsx";
import * as path from "path";
import * as fs from "fs";
import { BRAND_CONFIG } from "@james-andsons/config";

export interface FlipkartExportOptions {
  filter: "unlisted" | "all";
  categoryVertical?: string;
}

const TEMPLATE_MAP: Record<string, { file: string; sheet: string }> = {
  "ceiling lamp": {
    file: "C_ceiling-lamp_3571d6d57fad436b_1308-2038FK_REQ6AH6Q8FIO6.xls",
    sheet: "ceiling_lamp",
  },
  "floor lamp": {
    file: "C_floor-lamp_3571d6d57fad436b_1308-2039FK_REQEEJ96NV9XL.xls",
    sheet: "floor_lamp",
  },
  "floor lamps & lights": {
    file: "C_floor-lamp_3571d6d57fad436b_1308-2039FK_REQEEJ96NV9XL.xls",
    sheet: "floor_lamp",
  },
  "lamp shade": {
    file: "C_lamp-shade_3571d6d57fad436b_1308-2040FK_REQLXOQAVEA8Q.xls",
    sheet: "lamp_shade",
  },
  lantern: {
    file: "C_lantern_3571d6d57fad436b_1308-2040FK_REQYL6TOL3FHH.xls",
    sheet: "lantern",
  },
  "table lamp": {
    file: "C_table-lamp_3571d6d57fad436b_1308-2041FK_REQQ9QXYLFVJI.xls",
    sheet: "table_lamp",
  },
  "wall lamp": {
    file: "C_wall-lamp_3571d6d57fad436b_1308-2042FK_REQX6TQX8QAXV.xls",
    sheet: "wall_lamp",
  },
  "wall lamps": {
    file: "C_wall-lamp_3571d6d57fad436b_1308-2042FK_REQX6TQX8QAXV.xls",
    sheet: "wall_lamp",
  },
};

function getTemplatePath(vertical: string): {
  templatePath: string;
  sheetName: string;
  filename: string;
} {
  const normalized = (vertical || "ceiling lamp").toLowerCase();
  const config = TEMPLATE_MAP[normalized] || TEMPLATE_MAP["ceiling lamp"];

  const possiblePaths = [
    path.resolve(process.cwd(), "admin", "templates", "flipkart", config.file),
    path.resolve(process.cwd(), "templates", "flipkart", config.file),
    path.resolve(
      process.cwd(),
      "..",
      "admin",
      "templates",
      "flipkart",
      config.file,
    ),
    `/Users/abhishikt_mac/Downloads/Flipkart templates/${config.file}`,
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return {
        templatePath: p,
        sheetName: config.sheet,
        filename: config.file,
      };
    }
  }

  throw new Error(`Flipkart template file ${config.file} not found on server.`);
}

function writeCell(sheet: any, row: number, col: number, value: any) {
  const cellRef = XLSX.utils.encode_cell({ r: row - 1, c: col - 1 });
  if (value === null || value === undefined || value === "") {
    return;
  }
  let type = "s";
  if (typeof value === "number") type = "n";
  else if (typeof value === "boolean") type = "b";

  if (!sheet[cellRef]) {
    sheet[cellRef] = { t: type, v: value };
  } else {
    sheet[cellRef].t = type;
    sheet[cellRef].v = value;
    if (sheet[cellRef].w) delete sheet[cellRef].w;
  }
}

export function generateFlipkartExcelFeed(
  products: any[],
  options: FlipkartExportOptions,
): { buffer: Buffer; filename: string } {
  const vertical = options.categoryVertical || "Ceiling Lamp";
  const { templatePath, sheetName, filename } = getTemplatePath(vertical);

  console.log(
    `[Flipkart Feed Generator] Reading official template: ${templatePath} (Sheet: ${sheetName})`,
  );
  const fileBytes = fs.readFileSync(templatePath);
  const workbook = XLSX.read(fileBytes, {
    type: "buffer",
    cellStyles: true,
    cellFormula: true,
    cellDates: true,
    cellNF: true,
  });
  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    throw new Error(
      `Worksheet '${sheetName}' not found in Flipkart workbook template.`,
    );
  }

  // Map header columns dynamically from Row 1
  const headerMap: Record<string, number> = {};
  const range = XLSX.utils.decode_range(sheet["!ref"] || "A1:Z100");

  for (let c = 0; c <= range.e.c; c++) {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c });
    const cell = sheet[cellRef];
    if (cell && cell.v) {
      const headerName = String(cell.v).trim().toLowerCase();
      headerMap[headerName] = c + 1; // 1-indexed column number
    }
  }

  let rowIdx = 5;
  const brandName = "James And Sons";
  const manufacturerInfo = "James And Sons, Aligarh, Uttar Pradesh, India";

  for (const p of products) {
    const variants = p.variants || [];
    const itemsToExport =
      variants.length > 0
        ? variants.map((v: any) => ({
            sku: v.sku,
            title: `${p.name} - ${v.name}`,
            mrp: v.mrp || p.mrp,
            price: v.d2cPrice || p.d2cPrice,
            quantity: v.stockQuantity,
            images: v.images && v.images.length > 0 ? v.images : p.images,
          }))
        : [
            {
              sku: p.sku,
              title: p.name,
              mrp: p.mrp,
              price: p.d2cPrice,
              quantity: p.stockQuantity,
              images: p.images,
            },
          ];

    for (const item of itemsToExport) {
      if (!item.sku) continue;

      const mainImage = item.images?.[0]
        ? item.images[0].startsWith("http")
          ? item.images[0]
          : `${BRAND_CONFIG.storefrontUrl}${item.images[0]}`
        : `${BRAND_CONFIG.storefrontUrl}/images/placeholder.png`;

      // Extract dynamic product attributes
      const titleLower = (item.title || p.name || "").toLowerCase();
      const catLower = (p.category?.name || "").toLowerCase();

      let typeVal = "Pendant";
      if (
        titleLower.includes("chandelier") ||
        catLower.includes("chandelier")
      ) {
        typeVal = "Chandelier";
      } else if (
        titleLower.includes("pendant") ||
        titleLower.includes("hanging")
      ) {
        typeVal = "Pendant";
      } else if (
        titleLower.includes("wall") ||
        titleLower.includes("sconce") ||
        catLower.includes("wall")
      ) {
        typeVal = "Wall Lamp";
      } else if (titleLower.includes("floor") || catLower.includes("floor")) {
        typeVal = "Floor Lamp";
      } else if (titleLower.includes("table") || catLower.includes("table")) {
        typeVal = "Table Lamp";
      } else if (
        titleLower.includes("lantern") ||
        catLower.includes("lantern")
      ) {
        typeVal = "Lantern";
      }

      let matVal = "Brass";
      if (titleLower.includes("brass")) matVal = "Brass";
      else if (titleLower.includes("glass")) matVal = "Glass";
      else if (titleLower.includes("crystal")) matVal = "Crystal";
      else if (titleLower.includes("iron") || titleLower.includes("metal"))
        matVal = "Metal";
      else if (titleLower.includes("wood")) matVal = "Wood";
      else if (titleLower.includes("acrylic")) matVal = "Acrylic";

      let colorVal = "Gold";
      if (titleLower.includes("brass")) colorVal = "Brass";
      else if (titleLower.includes("gold")) colorVal = "Gold";
      else if (titleLower.includes("black")) colorVal = "Black";
      else if (titleLower.includes("copper")) colorVal = "Copper";
      else if (titleLower.includes("bronze")) colorVal = "Bronze";
      else if (titleLower.includes("silver") || titleLower.includes("chrome"))
        colorVal = "Silver";

      let numBulbs = 1;
      const bulbMatch = titleLower.match(/(\d+)\s*(light|bulb|way|head)/);
      if (bulbMatch) {
        numBulbs = parseInt(bulbMatch[1], 10);
      }

      const wVal = Number(p.actualWidth || p.breadth || 25);
      const lVal = Number(p.actualDepth || p.actualLength || p.length || 25);
      const hVal = Number(p.actualHeight || p.height || 50);
      const wtVal = Number(p.weight || p.packageWeight || 1.5);
      const powerVal = Number(p.powerConsumption || 40);

      // Helper to write by header title
      const setField = (headerTitle: string, value: any) => {
        const colNum = headerMap[headerTitle.toLowerCase()];
        if (colNum) {
          writeCell(sheet, rowIdx, colNum, value);
        }
      };

      // 1. Mandatory Flipkart Listing Fields
      setField("seller sku id", item.sku);
      setField("listing status", "Active");
      setField("mrp (inr)", Math.round(item.mrp || 4999));
      setField("your selling price (inr)", Math.round(item.price || 1999));
      setField("fullfilment by", "seller"); // MUST be lowercase 'seller'
      setField("procurement type", "express"); // MUST be lowercase 'express'
      setField("procurement sla (day)", 1);
      setField("stock", Math.max(0, item.quantity ?? 12));
      setField("shipping provider", "FLIPKART");

      // 2. Shipping Package Dimensions
      setField("length (cm)", Number(p.packageLength) || 17.78);
      setField("breadth (cm)", Number(p.packageWidth) || 10.16);
      setField("height (cm)", Number(p.packageHeight) || 50.8);
      setField("weight (kg)", wtVal);

      // 3. Tax & Manufacturer Compliance
      setField("hsn", p.hsnCode || "94051900");
      setField("luxury cess", 0);
      setField("country of origin", "India");
      setField("manufacturer details", manufacturerInfo);
      setField("packer details", manufacturerInfo);
      setField("tax code", "GST_18");
      setField("minimum order quantity (minoq)", 1);

      // 4. Brand & Catalog Attributes Required for QC
      setField("brand", brandName);
      setField("model number", item.sku);
      setField("model name", item.title || item.sku);
      setField("type", typeVal);
      setField("material", matVal);
      setField("shade material", matVal);
      setField("color", colorVal);
      setField("brand color", colorVal);
      setField("number of bulb", numBulbs);
      setField("width", wVal);
      setField("width - measuring unit", "cm");
      setField("length", lVal);
      setField("length - measuring unit", "cm");
      setField("height (cm)", hVal);
      setField("weight", wtVal);
      setField("weight - measuring unit", "kg");
      setField("power consumption", powerVal);
      setField("power consumption - measuring unit", "W");
      setField("pack of", 1);
      setField("bulb included", "No");
      setField("assembly required", "No");
      setField("features", "Decorative Lighting");
      setField("light source", "LED");
      setField("light color", "Warm White");
      setField("cord length", 100);
      setField("cord length - measuring unit", "cm");
      setField("items included", "1 Lamp Fixture, Mounting Kit");
      setField("holder type", "E27");
      setField("control method", "Wall Switch");
      setField("usage", "Decorative");
      setField("gift pack", "No");
      setField("suitable for", "Home, Living Room, Bedroom, Dining Room");

      // 5. Media & Search SEO
      setField("main image url", mainImage);
      setField("description", p.description || item.title || item.sku);
      setField(
        "search keywords",
        `${item.title}, luxury lighting, handcrafted brass lamp, chandelier, James & Sons`,
      );

      // 6. Warranty
      setField("domestic warranty", 1);
      setField("domestic warranty - measuring unit", "Year");
      setField(
        "warranty summary",
        "1 Year Warranty against Manufacturing Defects",
      );
      setField(
        "warranty service type",
        `Customer care email: ${BRAND_CONFIG.supportEmail || "support@jamesandsons.mobi"}`,
      );
      setField("covered in warranty", "Manufacturing defects");
      setField(
        "not covered in warranty",
        "Physical damage or improper installation",
      );

      rowIdx++;
    }
  }

  // Update workbook bounds
  sheet["!ref"] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: Math.max(rowIdx - 1, 10), c: Math.max(range.e.c, 60) },
  });

  const buffer = XLSX.write(workbook, { bookType: "biff8", type: "buffer" });
  return { buffer, filename };
}
