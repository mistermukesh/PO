const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const dir = 'C:/Users/mis/.gemini/antigravity-ide/brain/e29d89a8-e365-48a7-b1d5-690b21e2ee08';
const files = fs.readdirSync(dir).filter(f => f.startsWith('media__') && f.endsWith('.png'));

files.sort((a, b) => fs.statSync(path.join(dir, b)).mtimeMs - fs.statSync(path.join(dir, a)).mtimeMs);

console.log('Recent media PNGs:', files);

files.forEach(f => {
  const filePath = path.join(dir, f);
  const buf = fs.readFileSync(filePath);
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  console.log(`File: ${f}, Size: ${width}x${height}, FileSize: ${buf.length}`);
});
