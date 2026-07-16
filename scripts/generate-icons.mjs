import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const publicDir = join(__dirname, '..', 'frontend', 'public');
const svgPath = join(publicDir, 'favicon.svg');

const svg = readFileSync(svgPath);

const sizes = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'logo192.png', size: 192 },
  { name: 'logo512.png', size: 512 },
];

for (const s of sizes) {
  sharp(svg)
    .resize(s.size, s.size, {
      fit: 'contain',
      background: '#09090b',
    })
    .png()
    .toFile(join(publicDir, s.name))
    .then(() => console.log(`Generated ${s.name} (${s.size}x${s.size})`))
    .catch((err) => console.error(`Failed ${s.name}:`, err));
}
