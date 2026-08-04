const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function analyzeExactHeader() {
  const filePath = 'C:/Users/mis/.gemini/antigravity-ide/brain/e29d89a8-e365-48a7-b1d5-690b21e2ee08/media__1785821746253.png';
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

  console.log(`Analyzing Image: ${width}x${height}`);

  // Dark charcoal color sampling
  const darkPx = getPixel(50, Math.floor(height / 2));
  console.log(`Dark Charcoal RGB: rgb(${darkPx.r}, ${darkPx.g}, ${darkPx.b}) -> #${darkPx.r.toString(16).padStart(2,'0')}${darkPx.g.toString(16).padStart(2,'0')}${darkPx.b.toString(16).padStart(2,'0')}`);

  // Find Maroon Banner Y range & left slant
  let maroonPx = null;
  for (let x = Math.floor(width * 0.6); x < width - 10; x++) {
    for (let y = 0; y < height; y++) {
      const p = getPixel(x, y);
      // Maroon has distinct reddish/purple hue (r > 80, g < 60, b > 50)
      if (p.r > 80 && p.g < 60 && p.b > 50) {
        maroonPx = p;
        break;
      }
    }
    if (maroonPx) break;
  }

  if (maroonPx) {
    console.log(`Maroon RGB: rgb(${maroonPx.r}, ${maroonPx.g}, ${maroonPx.b}) -> #${maroonPx.r.toString(16).padStart(2,'0')}${maroonPx.g.toString(16).padStart(2,'0')}${maroonPx.b.toString(16).padStart(2,'0')}`);
  }

  // Scan Dark Block Right Edge Slant from y=0 to y=height-1
  console.log('\nDark Block Right Edge (x coordinates by y):');
  for (let y = 0; y < height; y += 4) {
    let darkRightX = -1;
    for (let x = 0; x < width; x++) {
      const p = getPixel(x, y);
      // Charcoal is dark: r < 60, g < 60, b < 60
      if (p.r < 70 && p.g < 70 && p.b < 70) {
        darkRightX = x;
      }
    }
    if (darkRightX !== -1) {
      console.log(`  y=${y} (pct=${(y/height*100).toFixed(1)}%): darkRightX=${darkRightX} (pct=${(darkRightX/width*100).toFixed(2)}%)`);
    }
  }

  // Scan Maroon Banner Left Edge Slant and Y bounds
  console.log('\nMaroon Banner Bounds & Left Edge Slant:');
  let maroonTopY = -1, maroonBottomY = -1;
  for (let y = 0; y < height; y++) {
    let maroonLeftX = -1;
    for (let x = 0; x < width; x++) {
      const p = getPixel(x, y);
      if (p.r > 70 && p.g < 65 && p.b > 50) {
        if (maroonLeftX === -1) maroonLeftX = x;
        if (maroonTopY === -1) maroonTopY = y;
        maroonBottomY = y;
      }
    }
    if (maroonLeftX !== -1) {
      console.log(`  y=${y} (pct=${(y/height*100).toFixed(1)}%): maroonLeftX=${maroonLeftX} (pct=${(maroonLeftX/width*100).toFixed(2)}%)`);
    }
  }

  console.log(`\nMaroon Banner Y-range: Top=${maroonTopY} (${(maroonTopY/height*100).toFixed(1)}%), Bottom=${maroonBottomY} (${(maroonBottomY/height*100).toFixed(1)}%), Height=${maroonBottomY - maroonTopY + 1} (${((maroonBottomY - maroonTopY + 1)/height*100).toFixed(1)}%)`);

}

analyzeExactHeader();
