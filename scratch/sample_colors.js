const fs = require('fs');
const zlib = require('zlib');

function sampleColors(filename) {
  const filePath = 'C:/Users/mis/.gemini/antigravity-ide/brain/e29d89a8-e365-48a7-b1d5-690b21e2ee08/' + filename;
  const buf = fs.readFileSync(filePath);
  let offset = 8;
  let width = 0, height = 0, colorType = 0;
  const idatChunks = [];

  while (offset < buf.length) {
    const len = buf.readUInt32BE(offset);
    const type = buf.toString('ascii', offset + 4, offset + 8);
    if (type === 'IHDR') {
      width = buf.readUInt32BE(offset + 8);
      height = buf.readUInt32BE(offset + 12);
      colorType = buf[offset + 17];
    } else if (type === 'IDAT') {
      idatChunks.push(buf.slice(offset + 8, offset + 8 + len));
    } else if (type === 'IEND') {
      break;
    }
    offset += 12 + len;
  }

  const decompressed = zlib.inflateSync(Buffer.concat(idatChunks));
  const bpp = colorType === 6 ? 4 : (colorType === 2 ? 3 : 1);
  const stride = 1 + width * bpp;

  function getPixel(x, y) {
    const lineStart = y * stride;
    const pxStart = lineStart + 1 + x * bpp;
    return {
      r: decompressed[pxStart],
      g: decompressed[pxStart + 1],
      b: decompressed[pxStart + 2]
    };
  }

  console.log(`=== Colors for ${filename} ===`);
  const colorMap = {};
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const p = getPixel(x, y);
      const hex = `#${p.r.toString(16).padStart(2,'0')}${p.g.toString(16).padStart(2,'0')}${p.b.toString(16).padStart(2,'0')}`.toUpperCase();
      colorMap[hex] = (colorMap[hex] || 0) + 1;
    }
  }

  const sorted = Object.entries(colorMap).sort((a,b) => b[1] - a[1]);
  console.log('Top 15 Most Common Hex Colors:');
  sorted.slice(0, 15).forEach(([hex, count]) => {
    console.log(`  ${hex}: ${count} pixels`);
  });
}

sampleColors('media__1785821746253.png');
