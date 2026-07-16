
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend/src/components/AdminDashboard.tsx');
const content = fs.readFileSync(filePath, 'utf-8');

const lines = content.split('\n');
let balance = 0;
let maxBalance = 0;

lines.forEach((line, idx) => {
  const lineNum = idx + 1;
  const openDivs = (line.match(/<div\b/g) || []).length;
  const closeDivs = (line.match(/<\/div>/g) || []).length;
  balance += openDivs - closeDivs;
  if (balance > maxBalance) {
    maxBalance = balance;
  }
  if (balance < 0) {
    console.log(`Line ${lineNum}: Negative balance: ${balance}`);
    console.log(`Content: ${line}`);
  }
  if (lineNum % 50 === 0 || balance === maxBalance) {
    console.log(`Line ${lineNum}: Balance = ${balance}`);
  }
});

console.log(`\nFinal balance: ${balance}`);
console.log(`Max balance: ${maxBalance}`);
