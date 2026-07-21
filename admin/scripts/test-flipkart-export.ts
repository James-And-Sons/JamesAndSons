import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

// Load env variables manually from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
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

async function run() {
  console.log('Loading database client dynamically...');
  const { prisma } = await import('@james-andsons/db');
  
  console.log('Fetching products...');
  const products = await prisma.product.findMany({
    include: { variants: true },
    orderBy: { name: 'asc' }
  });
  console.log(`Fetched ${products.length} products.`);

  const templatePath = path.resolve(process.cwd(), 'FLIPKART_WALL_LAMP_TEMPLATE.xls');
  console.log(`Reading template from: ${templatePath}`);
  const fileBytes = fs.readFileSync(templatePath);
  const workbook = XLSX.read(fileBytes, { type: 'buffer' });
  const sheet = workbook.Sheets['Parent Variant Products'];
  if (!sheet) {
    throw new Error("Worksheet 'Parent Variant Products' not found");
  }

  // Clear data from row 5
  console.log('Clearing old data from row 5 onwards...');
  for (const key of Object.keys(sheet)) {
    if (key.startsWith('!')) continue;
    const cell = XLSX.utils.decode_cell(key);
    if (cell.r >= 4) {
      delete sheet[key];
    }
  }

  // Helper write function
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

  console.log('Writing test product rows to Excel sheet...');
  let rowIdx = 5;
  for (const p of products) {
    writeCell(sheet, rowIdx, 7, p.sku); // Seller SKU ID
    writeCell(sheet, rowIdx, 9, p.brand || 'James and Sons'); // Brand
    writeCell(sheet, rowIdx, 10, 'Wall Mounted');
    writeCell(sheet, rowIdx, 11, 'Brass');
    rowIdx++;
  }

  // Update bounds
  let maxRow = 5;
  let maxCol = 1;
  for (const key of Object.keys(sheet)) {
    if (key.startsWith('!')) continue;
    const cell = XLSX.utils.decode_cell(key);
    if (cell.r + 1 > maxRow) maxRow = cell.r + 1;
    if (cell.c + 1 > maxCol) maxCol = cell.c + 1;
  }
  sheet['!ref'] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: maxRow - 1, c: Math.max(maxCol - 1, 67) }
  });

  console.log('Writing populated workbook buffer...');
  const fileBuffer = XLSX.write(workbook, {
    bookType: 'xls',
    type: 'buffer'
  });

  console.log('Parsing generated buffer to verify contents...');
  const verifiedWorkbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const verifiedSheet = verifiedWorkbook.Sheets['Parent Variant Products'];
  const cellVal = verifiedSheet[XLSX.utils.encode_cell({ r: 4, c: 6 })]; // Row 5, Col 7 (G)
  console.log('Verified first written SKU cell value:', cellVal ? cellVal.v : 'N/A');
  if (cellVal && cellVal.v) {
    console.log('TEST PASSED! Excel generated and verified successfully.');
  } else {
    throw new Error('TEST FAILED: Target cell is empty.');
  }
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
