const XLSX = require('xlsx');

const workbook = XLSX.readFile('/home/user/webapp/users_data.xlsx');
const sheetName = workbook.SheetNames[0];
console.log('Sheet names:', workbook.SheetNames);

const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

console.log('\n=== First 15 rows ===');
data.slice(0, 15).forEach((row, idx) => {
  console.log(`Row ${idx}:`, row);
});

console.log('\n=== Column headers (Row 0) ===');
console.log(data[0]);

console.log('\n=== Total rows:', data.length);
