// src/crypto/pesCrypto.ts
// PES EDIT file decryption - handles both encrypted and decrypted files

import { Blowfish } from './blowfish';

export async function initCrypto(): Promise<void> {
  console.log('✅ [CRYPTO] Initialized');
}

export function decryptEditBin(buffer: ArrayBuffer): ArrayBuffer {
  const data = new Uint8Array(buffer);
  const view = new DataView(buffer);
  
  console.log('[CRYPTO] Input size:', data.length);
  console.log('[CRYPTO] First 16 bytes:', formatHex(data.slice(0, 16)));

  // Check if file is ALREADY DECRYPTED
  // Decrypted files start with small version number (0x0E = 14, etc.)
  const firstDword = view.getUint32(0, true);
  const secondDword = view.getUint32(4, true);
  
  if (firstDword <= 0x20 && secondDword <= 0x200 && secondDword > 0) {
    console.log('[CRYPTO] ✅ File is ALREADY DECRYPTED');
    console.log('[CRYPTO] Version:', firstDword, 'Header size:', secondDword);
    return buffer; // Return as-is, no decryption needed
  }

  // File is encrypted - apply MT19937
  const seed = firstDword;
  console.log('[CRYPTO] File is ENCRYPTED, using seed:', '0x' + seed.toString(16).toUpperCase());

  const decrypted = mt19937Decrypt(data, seed);
  console.log('[CRYPTO] After MT19937:', formatHex(decrypted.slice(0, 32)));

  // After MT19937, check for zlib compression
  const zlibOffsets = findZlibHeaders(decrypted);
  console.log('[CRYPTO] Found', zlibOffsets.length, 'zlib chunks');

  if (zlibOffsets.length > 0) {
    console.log('[CRYPTO] Attempting to decompress zlib chunks...');
    const decompressed = decompressEditFile(decrypted, zlibOffsets);
    if (decompressed) {
      console.log('[CRYPTO] ✅ Decompression successful! Size:', decompressed.length);
      return decompressed.buffer;
    }
  }

  // Return MT19937 decrypted data
  return decrypted.buffer;
}

function mt19937Decrypt(data: Uint8Array, seed: number): Uint8Array {
  const result = new Uint8Array(data.length);
  
  const mt = new Uint32Array(624);
  let idx = 624;

  mt[0] = seed >>> 0;
  for (let i = 1; i < 624; i++) {
    const s = mt[i - 1] ^ (mt[i - 1] >>> 30);
    mt[i] = (((((s & 0xFFFF0000) >>> 16) * 1812433253) << 16) +
             (s & 0x0000FFFF) * 1812433253 + i) >>> 0;
  }

  function twist(): void {
    for (let i = 0; i < 624; i++) {
      const y = (mt[i] & 0x80000000) | (mt[(i + 1) % 624] & 0x7FFFFFFF);
      mt[i] = mt[(i + 397) % 624] ^ (y >>> 1);
      if (y & 1) mt[i] ^= 0x9908B0DF;
    }
    idx = 0;
  }

  function nextUint32(): number {
    if (idx >= 624) twist();
    let y = mt[idx++];
    y ^= (y >>> 11);
    y ^= ((y << 7) & 0x9D2C5680);
    y ^= ((y << 15) & 0xEFC60000);
    y ^= (y >>> 18);
    return y >>> 0;
  }

  result[0] = 0;
  result[1] = 0;
  result[2] = 0;
  result[3] = 0;

  for (let i = 4; i < data.length; i += 4) {
    const rand = nextUint32();
    for (let j = 0; j < 4 && (i + j) < data.length; j++) {
      result[i + j] = data[i + j] ^ ((rand >>> (j * 8)) & 0xFF);
    }
  }

  return result;
}

function findZlibHeaders(data: Uint8Array): number[] {
  const offsets: number[] = [];
  for (let i = 0; i < data.length - 2; i++) {
    if (data[i] === 0x78 && 
        (data[i + 1] === 0x9C || data[i + 1] === 0xDA || 
         data[i + 1] === 0x01 || data[i + 1] === 0x5E)) {
      offsets.push(i);
    }
  }
  return offsets;
}

function decompressEditFile(data: Uint8Array, zlibOffsets: number[]): Uint8Array | null {
  // PES EDIT files have a structure where zlib chunks are stored with size headers
  // Try to find and decompress them
  
  try {
    // Check if we can use browser's DecompressionStream
    if (typeof DecompressionStream === 'undefined') {
      console.log('[CRYPTO] DecompressionStream not available');
      return null;
    }

    // For now, return null - we'll handle this in the parser
    // The actual decompression would require pako or similar library
    return null;
  } catch (e) {
    console.log('[CRYPTO] Decompression error:', e);
    return null;
  }
}

function formatHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join(' ');
}

export function encryptEditBin(buffer: ArrayBuffer): ArrayBuffer {
  return buffer;
}
