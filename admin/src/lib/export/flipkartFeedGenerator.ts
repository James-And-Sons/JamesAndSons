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
      return { templatePath: p, sheetName: config.sheet };
    }
  }

  throw new Error(`Flipkart template file ${config.file} not found on server.`);
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

export function generateFlipkartExcelFeed(
  products: any[],
  options: FlipkartExportOptions,
): Buffer {
  const vertical = options.categoryVertical || "Ceiling Lamp";
  const { templatePath, sheetName } = getTemplatePath(vertical);

  console.log(
    `[Flipkart Feed Generator] Reading official template: ${templatePath} (Sheet: ${sheetName})`,
  );
  const fileBytes = fs.readFileSync(templatePath);
  const workbook = XLSX.read(fileBytes, { type: "buffer" });
  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    throw new Error(
      `Worksheet '${sheetName}' not found in Flipkart workbook template.`,
    );
  }

  // Clear existing template sample data starting from Row 5
  for (const key of Object.keys(sheet)) {
    if (key.startsWith("!")) continue;
    const cell = XLSX.utils.decode_cell(key);
    if (cell.r >= 4) {
      delete sheet[key];
    }
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

      // Helper to write by header title
      const setField = (headerTitle: string, value: any) => {
        const colNum = headerMap[headerTitle.toLowerCase()];
        if (colNum) {
          writeCell(sheet, rowIdx, colNum, value);
        }
      };

      setField("seller sku id", item.sku);
      setField("listing status", "ACTIVE");
      setField("mrp (inr)", Math.round(item.mrp || 4999));
      setField("your selling price (inr)", Math.round(item.price || 1999));
      setField("fullfilment by", "IN_HOUSE");
      setField("procurement type", "EXPRESS");
      setField("procurement sla (day)", 1);
      setField("stock", Math.max(0, item.quantity ?? 12));
      setField("shipping provider", "FLIPKART");
      setField("length (cm)", Number(p.packageLength) || 17.78);
      setField("breadth (cm)", Number(p.packageWidth) || 10.16);
      setField("height (cm)", Number(p.packageHeight) || 50.8);
      setField("weight (kg)", Number(p.packageWeight) || 0.7);
      setField("hsn", p.hsnCode || "94051900");
      setField("luxury cess", 0);
      setField("country of origin", "IN");
      setField("manufacturer details", manufacturerInfo);
      setField("packer details", manufacturerInfo);
      setField("tax code", "GST_18");
      setField("minimum order quantity (minoq)", 1);
      setField("brand", brandName);
      setField("main image url", mainImage);
      setField("description", p.description || item.title || item.sku);
      setField(
        "search keywords",
        `${item.title}, luxury lighting, handcrafted brass lamp, chandelier, James & Sons`,
      );

      rowIdx++;
    }
  }

  // Update workbook bounds
  sheet["!ref"] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: Math.max(rowIdx - 1, 10), c: Math.max(range.e.c, 60) },
  });

  return XLSX.write(workbook, { bookType: "xls", type: "buffer" });
}
