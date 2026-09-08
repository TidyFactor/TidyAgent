/**
 * Tidy Studio Icon Generator
 * Generates valid PNG and modern ICO assets for Windows distribution without external build deps.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ASSETS_DIR = path.join(__dirname, '../assets');
if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

// Minimal 64x64 RGBA PNG Generator
function createPng(width, height) {
  // Raw RGBA pixel buffer with filter byte 0 at start of each scanline
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter: None

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      
      // Calculate distance from center for radial branding circle
      const dx = x - width / 2;
      const dy = y - height / 2;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < width * 0.45) {
        // Luxury Cyan / Indigo radial gradient
        const t = dist / (width * 0.45);
        rawData[pixelOffset] = Math.round(0 * (1 - t) + 139 * t);     // R
        rawData[pixelOffset + 1] = Math.round(229 * (1 - t) + 92 * t);  // G
        rawData[pixelOffset + 2] = Math.round(255 * (1 - t) + 246 * t); // B
        rawData[pixelOffset + 3] = 255;                                 // Alpha
      } else {
        // Transparent outer border
        rawData[pixelOffset] = 0;
        rawData[pixelOffset + 1] = 0;
        rawData[pixelOffset + 2] = 0;
        rawData[pixelOffset + 3] = 0;
      }
    }
  }

  // Compress IDAT payload with zlib
  const compressedData = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // Helper to create PNG Chunk
  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);

    const typeBuf = Buffer.from(type, 'ascii');
    const crcPayload = Buffer.concat([typeBuf, data]);

    // CRC32 calculation
    let crc = 0xffffffff;
    for (let i = 0; i < crcPayload.length; i++) {
      crc ^= crcPayload[i];
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ (-(crc & 1) & 0xedb88320);
      }
    }
    crc = (crc ^ 0xffffffff) >>> 0;

    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc, 0);

    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  // IHDR chunk: width, height, bit depth 8, color type 6 (RGBA), compression 0, filter 0, interlace 0
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // IDAT chunk
  const idatChunk = makeChunk('IDAT', compressedData);

  // IEND chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createIco(pngBuffer, size = 64) {
  // ICONDIR header: 6 bytes
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // 1 = ICO
  header.writeUInt16LE(1, 4); // 1 image

  // ICONDIRENTRY: 16 bytes
  const entry = Buffer.alloc(16);
  entry[0] = size >= 256 ? 0 : size; // Width
  entry[1] = size >= 256 ? 0 : size; // Height
  entry[2] = 0; // Colors (0 = no palette)
  entry[3] = 0; // Reserved
  entry.writeUInt16LE(1, 4);  // Color planes
  entry.writeUInt16LE(32, 6); // Bits per pixel
  entry.writeUInt32LE(pngBuffer.length, 8); // Size of image data
  entry.writeUInt32LE(22, 12); // Offset to image data (6 + 16 = 22)

  return Buffer.concat([header, entry, pngBuffer]);
}

// Generate files
const pngBuffer = createPng(64, 64);
const icoBuffer = createIco(pngBuffer, 64);

const pngPath = path.join(ASSETS_DIR, 'icon.png');
const icoPath = path.join(ASSETS_DIR, 'icon.ico');

fs.writeFileSync(pngPath, pngBuffer);
fs.writeFileSync(icoPath, icoBuffer);

console.log(`✨ Generated Tidy Studio application icons:`);
console.log(`   - PNG: ${pngPath} (${pngBuffer.length} bytes)`);
console.log(`   - ICO: ${icoPath} (${icoBuffer.length} bytes)`);
