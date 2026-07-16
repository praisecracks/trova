
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend/src/components/AdminDashboard.tsx');
const content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

let divBalance = 0;
let curlyBalance = 0;

lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const divOpens = (line.match(/<div\b/g) || []).length;
    const divCloses = (line.match(/<\/div>/g) || []).length;
    const curlyOpens = (line.match(/{/g) || []).length;
    const curlyCloses = (line.match(/}/g) || []).length;

    divBalance += divOpens - divCloses;
    curlyBalance += curlyOpens - curlyCloses;

    if (divOpens > 0 || divCloses > 0 || curlyOpens > 0 || curlyCloses > 0) {
        console.log(`Line ${lineNum} | div: ${divBalance} | curly: ${curlyBalance} | ${line.trim()}`);
    }
});

console.log(`Final div balance: ${divBalance}`);
console.log(`Final curly balance: ${curlyBalance}`);
