import * as XLSX from 'xlsx';
import path from 'path';

const outPath = path.join(__dirname, '..', '..', 'amazon_listing_feed.xlsm');
const workbook = XLSX.readFile(outPath);
const sheet = workbook.Sheets['Template'];

console.log('Sheet Names:', workbook.SheetNames);
console.log('Bounds:', sheet['!ref']);

// Col index to letter utility
function getVal(colIdx: number) {
  const cellRef = XLSX.utils.encode_cell({ r: 7, c: colIdx - 1 });
  return sheet[cellRef]?.v;
}

console.log('Col 1 (SKU):', getVal(1));
console.log('Col 7 (Item Name):', getVal(7));
console.log('Col 12 (Browse Node ID):', getVal(12));
console.log('Col 17 (Model Number):', getVal(17));
console.log('Col 18 (Model Name):', getVal(18));
console.log('Col 19 (Manufacturer):', getVal(19));
console.log('Col 38 (Keywords):', getVal(38));
console.log('Col 48 (Style):', getVal(48));
console.log('Col 49 (Material):', getVal(49));
console.log('Col 54 (Number of Items):', getVal(54));
console.log('Col 55 (Item Type Name):', getVal(55));
console.log('Col 56 (Water Resistance Level):', getVal(56));
console.log('Col 57 (Color):', getVal(57));
console.log('Col 58 (Size):', getVal(58));
console.log('Col 59 (Number of Pieces):', getVal(59));
console.log('Col 63 (Theme):', getVal(63));
console.log('Col 68 (Manufacturer Contact Info):', getVal(68));
console.log('Col 79 (Lighting Method):', getVal(79));
console.log('Col 90 (Fixture Form):', getVal(90));
console.log('Col 93 (Mounting Type):', getVal(93));
console.log('Col 94 (Finish Type):', getVal(94));
console.log('Col 100 (Included Components):', getVal(100));
console.log('Col 105 (Specific Uses for Product):', getVal(105));
console.log('Col 127 (Bulb Base):', getVal(127));
console.log('Col 151 (Room Type 1):', getVal(151));
console.log('Col 241 (Installation Location):', getVal(241));
console.log('Col 283 (Your Price INR - B2B):', getVal(283));
console.log('Col 284 (Maximum Retail Price - B2B):', getVal(284));
console.log('Col 289 (Quantity Price Type - B2B):', getVal(289));
console.log('Col 290 (Quantity Threshold 1 - B2B):', getVal(290));
console.log('Col 291 (Quantity Price 1 - B2B):', getVal(291));
console.log('Col 396 (Manufacturer\'s Email):', getVal(396));
console.log('Col 301 (Item Package Length):', getVal(301));
console.log('Col 307 (Package Weight):', getVal(307));
console.log('Col 229 (Item Height):', getVal(229));
console.log('Col 197 (Item Weight):', getVal(197));
