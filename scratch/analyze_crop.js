const fs = require('fs');
const zlib = require('zlib');

function analyzeFile(filename) {
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
    if (x < 0 || x >= width || y < 0 || y >= height) return { r: 0, g: 0, b: 0 };
    const lineStart = y * stride;
    const pxStart = lineStart + 1 + x * bpp;
    return {
      r: decompressed[pxStart],
      g: decompressed[pxStart + 1],
      b: decompressed[pxStart + 2]
    };
  }

  console.log(`=== File: ${filename} (${width}x${height}) ===`);

  // Dark charcoal left panel sampling
  const darkPx = getPixel(20, Math.floor(height / 2));
  console.log(`Dark Charcoal RGB: rgb(${darkPx.r}, ${darkPx.g}, ${darkPx.b}) -> #${darkPx.r.toString(16).padStart(2,'0')}${darkPx.g.toString(16).padStart(2,'0')}${darkPx.b.toString(16).padStart(2,'0')}`);

  // Sample Maroon Banner RGB at x=400, y=height/2
  const marPx = getPixel(400, Math.floor(height / 2));
  console.log(`Maroon Banner RGB: rgb(${marPx.r}, ${marPx.g}, ${marPx.b}) -> #${marPx.r.toString(16).padStart(2,'0')}${marPx.g.toString(16).padStart(2,'0')}${marPx.b.toString(16).padStart(2,'0')}`);

  // Dark Block Right Edge Slant (finding x where dark panel ends)
  console.log('Dark Block Right Edge (x by y):');
  for (let y = 0; y < height; y += Math.max(1, Math.floor(height/10))) {
    let rightX = -1;
    for (let x = 0; x < Math.floor(width * 0.5); x++) {
      const p = getPixel(x, y);
      if (p.r < 70 && p.g < 70 && p.b < 70) {
        rightX = x;
      }
    }
    console.log(`  y=${y} (pct=${(y/height*100).toFixed(1)}%): darkRightX=${rightX} (pct=${(rightX/width*100).toFixed(2)}%)`);
  }

  // Maroon Banner Left Edge Slant and Y range
  console.log('\nMaroon Banner Bounds & Slant:');
  let mTop = -1, mBot = -1;
  for (let y = 0; y < height; y += Math.max(1, Math.floor(height/15))) {
    let leftX = -1;
    for (let x = 0; x < width; x++) {
      const p = getPixel(x, y);
      if (p.r > 70 && p.g < 70 && p.b > 40) { // Maroon
        if (leftX === -1) leftX = x;
        if (mTop === -1) mTop = y;
        mBot = y;
      }
    }
    if (leftX !== -1) {
      console.log(`  y=${y} (pct=${(y/height*100).toFixed(1)}%): maroonLeftX=${leftX} (pct=${(leftX/width*100).toFixed(2)}%)`);
    }
  }

  console.log(`Maroon Y-range: top=${mTop} (${(mTop/height*100).toFixed(1)}%), bottom=${mBot} (${(mBot/height*100).toFixed(1)}%)\n`);
}

analyzeFile('media__1785821310819.png');
