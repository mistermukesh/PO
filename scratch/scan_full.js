const fs = require('fs');
const zlib = require('zlib');

function analyzeFullHeader() {
  const buf = fs.readFileSync('C:/Users/mis/.gemini/antigravity-ide/brain/e29d89a8-e365-48a7-b1d5-690b21e2ee08/media__1785820939137.png');
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
  const bpp = colorType === 6 ? 4 : 3;
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

  console.log(`Image Size: ${width}x${height}`);

  // Let's print out sample colors every 10 pixels vertically down the middle
  const midX = Math.floor(width / 2);
  console.log(`Scanning vertical column at x=${midX}:`);
  for (let y = 0; y < height; y += 10) {
    const p = getPixel(midX, y);
    const hex = `#${p.r.toString(16).padStart(2,'0')}${p.g.toString(16).padStart(2,'0')}${p.b.toString(16).padStart(2,'0')}`;
    console.log(`y=${y}: ${hex} (r:${p.r}, g:${p.g}, b:${p.b})`);
  }

  // Let's find the exact dark block and maroon block at y=20
  console.log(`\nScanning horizontal row at y=20:`);
  for (let x = 0; x < width; x += 10) {
    const p = getPixel(x, 20);
    const hex = `#${p.r.toString(16).padStart(2,'0')}${p.g.toString(16).padStart(2,'0')}${p.b.toString(16).padStart(2,'0')}`;
    console.log(`x=${x}: ${hex}`);
  }
}

analyzeFullHeader();
