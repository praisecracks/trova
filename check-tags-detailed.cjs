
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend/src/components/AdminDashboard.tsx');
const content = fs.readFileSync(filePath, 'utf-8');

const lines = content.split('\n');
let balance = 0;
let maxBalance = 0;

console.log('Line | Balance | Content');
console.log('-------------------------------------------');

lines.forEach((line, idx) => {
  const lineNum = idx + 1;
  const openDivs = (line.match(/<div\b/g) || []).length;
  const closeDivs = (line.match(/<\/div>/g) || []).length;
  balance += openDivs - closeDivs;
  
  if (balance > maxBalance) {
    maxBalance = balance;
  }

  // Print every 50th line or if balance changes a lot
  if (lineNum % 50 === 0 || openDivs > 0 || closeDivs > 0) {
    console.log(`${lineNum.toString().padStart(4)} | ${balance.toString().padStart(4)} | ${line.trim().substring(0, 80)}`);
  }
});

console.log('\n-------------------------------------------');
console.log(`Final balance: ${balance}`);
console.log(`Max balance: ${maxBalance}`);
