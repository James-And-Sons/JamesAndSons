import * as XLSX from 'xlsx';
import path from 'path';

const outPath = path.join(__dirname, '..', '..', 'amazon_listing_feed.xlsm');
const workbook = XLSX.readFile(outPath);
console.log('Sheet Names:', workbook.SheetNames);
const sheet = workbook.Sheets['Template'];
console.log('Bounds:', sheet['!ref']);
console.log('A8 (SKU Row 8):', sheet['A8']?.v);
console.log('G8 (Item Name Row 8):', sheet['G8']?.v);
console.log('A9 (SKU Row 9):', sheet['A9']?.v);
console.log('G9 (Item Name Row 9):', sheet['G9']?.v);
console.log('A10 (SKU Row 10):', sheet['A10']?.v);
console.log('G10 (Item Name Row 10):', sheet['G10']?.v);
