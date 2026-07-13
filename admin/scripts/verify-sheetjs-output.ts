import * as XLSX from 'xlsx';
import path from 'path';

const outPath = path.join(__dirname, '..', '..', 'amazon_listing_feed.xlsm');
const workbook = XLSX.readFile(outPath);
const sheet = workbook.Sheets['Template'];

console.log('Sheet Names:', workbook.SheetNames);
console.log('Bounds:', sheet['!ref']);
console.log('A8 (SKU):', sheet['A8']?.v);
console.log('G8 (Item Name):', sheet['G8']?.v);
console.log('L8 (Browse Node ID - Col 12):', sheet['L8']?.v);
console.log('Q8 (Style - Col 17):', sheet['Q8']?.v);
console.log('S8 (Material - Col 19):', sheet['S8']?.v);
console.log('AL8 (Keywords - Col 38):', sheet['AL8']?.v);
console.log('CL8 (Fixture Form - Col 90):', sheet['CL8']?.v);
console.log('CO8 (Installation Location - Col 93):', sheet['CO8']?.v);
