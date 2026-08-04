const fs = require('fs');
const zlib = require('zlib');

function decodePNG(filePath) {
  const buf = fs.readFileSync(filePath);
  let offset = 8;
  let width = 0, height = 0, bitDepth = 0, colorType = 0;
  const idatChunks = [];

  while (offset < buf.length) {
    const len = buf.readUInt32BE(offset);
    const type = buf.toString('ascii', offset + 4, offset + 8);
    if (type === 'IHDR') {
      width = buf.readUInt32BE(offset + 8);
      height = buf.readUInt32BE(offset + 12);
      bitDepth = buf[offset + 16];
      colorType = buf[offset + 17];
    } else if (type === 'IDAT') {
      idatChunks.push(buf.slice(offset + 8, offset + 8 + len));
    } else if (type === 'IEND') {
      break;
    }
    offset += 12 + len;
  }

  const compressedData = Buffer.concat(idatChunks);
  const decompressed = zlib.inflateSync(compressedData);

  console.log(`PNG Dimensions: ${width}x${height}, ColorType: ${colorType}, BitDepth: ${bitDepth}`);
  return { width, height, decompressed, colorType };
}

try {
  const imgPath = 'C:/Users/mis/.gemini/antigravity-ide/brain/e29d89a8-e365-48a7-b1d5-690b21e2ee08/media__1785820939137.png';
  const img = decodePNG(imgPath);
  
  // Find where the dark charcoal color starts and ends in y
  // ColorType 6 = RGBA (4 bytes per pixel + 1 filter byte per line)
  // ColorType 2 = RGB (3 bytes per pixel + 1 filter byte per line)
  const bpp = img.colorType === 6 ? 4 : 3;
  const stride = 1 + img.width * bpp;

  function getPixel(x, y) {
    const lineStart = y * stride;
    const pxStart = lineStart + 1 + x * bpp;
    return {
      r: img.decompressed[pxStart],
      g: img.decompressed[pxStart + 1],
      b: img.decompressed[pxStart + 2]
    };
  }

  // Scan top to bottom at x=10 to find header dark block
  let headerTop = -1, headerBottom = -1;
  for (let y = 0; y < Math.min(200, img.height); y++) {
    const p = getPixel(10, y);
    // Dark charcoal is approx R<60, G<60, B<60
    if (p.r < 80 && p.g < 80 && p.b < 80) {
      if (headerTop === -1) headerTop = y;
      headerBottom = y;
    }
  }

  console.log(`Header banner Y range at x=10: Top=${headerTop}, Bottom=${headerBottom}, Height=${headerBottom - headerTop + 1}`);

  // Sample colors inside dark block, maroon block, white gap
  const darkPx = getPixel(50, headerTop + 10);
  console.log(`Dark Charcoal RGB: rgb(${darkPx.r}, ${darkPx.g}, ${darkPx.b}) -> #${darkPx.r.toString(16).padStart(2,'0')}${darkPx.g.toString(16).padStart(2,'0')}${darkPx.b.toString(16).padStart(2,'0')}`);

  // Find Maroon block Y and X range
  let maroonPx = null;
  for (let x = Math.floor(img.width * 0.5); x < img.width - 10; x++) {
    for (let y = headerTop; y <= headerBottom; y++) {
      const p = getPixel(x, y);
      if (p.r > 80 && p.g < 60 && p.b > 50) { // Maroon
        maroonPx = { x, y, r: p.r, g: p.g, b: p.b };
        break;
      }
    }
    if (maroonPx) break;
  }

  if (maroonPx) {
    console.log(`Maroon RGB: rgb(${maroonPx.r}, ${maroonPx.g}, ${maroonPx.b}) -> #${maroonPx.r.toString(16).padStart(2,'0')}${maroonPx.g.toString(16).padStart(2,'0')}${maroonPx.b.toString(16).padStart(2,'0')}`);
  }

  // Analyze slant coordinates of dark container right edge
  console.log('\nScanning Dark Block Right Edge Slant:');
  for (let y = headerTop; y <= headerBottom; y += 5) {
    let rightX = -1;
    for (let x = 0; x < img.width; x++) {
      const p = getPixel(x, y);
      if (p.r < 80 && p.g < 80 && p.b < 80) {
        rightX = x;
      }
    }
    console.log(`  y=${y} (relative y=${y - headerTop}): rightX=${rightX} (${(rightX / img.width * 100).toFixed(2)}%)`);
  }

  // Analyze Maroon Block Left Edge Slant and Top/Bottom Y
  console.log('\nScanning Maroon Block Left Edge Slant:');
  let maroonTopY = -1, maroonBottomY = -1;
  for (let y = headerTop; y <= headerBottom; y++) {
    let leftX = -1;
    for (let x = 0; x < img.width; x++) {
      const p = getPixel(x, y);
      if (p.r > 80 && p.g < 60 && p.b > 50) { // Maroon
        if (leftX === -1) leftX = x;
        if (maroonTopY === -1) maroonTopY = y;
        maroonBottomY = y;
      }
    }
    if (leftX !== -1) {
      console.log(`  y=${y} (relative y=${y - headerTop}): maroonLeftX=${leftX} (${(leftX / img.width * 100).toFixed(2)}%)`);
    }
  }

  console.log(`Maroon Y range relative to header: top=${maroonTopY - headerTop}, bottom=${maroonBottomY - headerTop}, height=${maroonBottomY - maroonTopY + 1}`);

} catch (err) {
  console.error('Error decoding PNG:', err);
}
