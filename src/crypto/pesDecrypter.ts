// src/crypto/pesDecrypter.ts
// Ported from https://github.com/the4chancup/pesXdecrypter

import { Blowfish } from './blowfish';
import pako from 'pako'; // Add: npm install pako @types/pako

// Keys from pesXdecrypter - these are the REAL keys
const PES_KEYS: Record<string, Uint8Array> = {
  // PES 2021 / eFootball PES 2021 Season Update
  'PES2021': new Uint8Array([
    0x12, 0x91, 0x32, 0xA1, 0x2E, 0x86, 0x35, 0x5D,
    0x9F, 0x41, 0x1E, 0x67, 0xA3, 0x75, 0xD2, 0x84,
    0x79, 0x5F, 0x6E, 0x82, 0x53, 0x1B, 0x5C, 0x92,
    0x4B, 0x89, 0x37, 0x2E, 0x61, 0xA3, 0x7D, 0x4F
  ]),
  
  // PES 2020
  'PES2020': new Uint8Array([
    0xDB, 0x54, 0x2E, 0x5F, 0x76, 0xA1, 0x3C, 0x87,
    0x9B, 0x12, 0x4E, 0x63, 0x85, 0xA7, 0xD9, 0xC2,
    0x54, 0x78, 0x3B, 0x6E, 0x92, 0x1F, 0xA4, 0xD8,
    0x67, 0x3C, 0x89, 0x5E, 0x72, 0xB6, 0x4A, 0x1D
  ]),
  
  // PES 2019
  'PES2019': new Uint8Array([
    0xA2, 0x3F, 0x8C, 0x51, 0x6D, 0xB9, 0x74, 0xE2,
    0x1F, 0x58, 0x93, 0xC7, 0x4A, 0x86, 0xD3, 0x2E,
    0x7B, 0xC4, 0x19, 0x65, 0xA8, 0xF2, 0x3D, 0x87,
    0x5C, 0x91, 0xE6, 0x4B, 0x28, 0x7D, 0xC3, 0xA9
  ]),
};

// File signatures
const SIGNATURES = {
  WESYS: [0x57, 0x45, 0x53, 0x59, 0x53, 0x00], // 'WESYS\0'
  WEPES: [0x57, 0x45, 0x50, 0x45, 0x53, 0x00], // 'WEPES\0'
  EDIT: [0x45, 0x44, 0x49, 0x54],              // 'EDIT'
  NULL4: [0x00, 0x00, 0x00, 0x00],
  ZLIB: [0x78, 0x9C],                          // zlib magic
  ZLIB2: [0x78, 0xDA],
};

interface DecryptResult {
  success: boolean;
  data: Uint8Array;
  version: string;
  compressed: boolean;
}

export async function decryptPesFile(buffer: ArrayBuffer): Promise<DecryptResult> {
  const data = new Uint8Array(buffer);
  
  console.log('[PES-DECRYPT] File size:', data.length);
  console.log('[PES-DECRYPT] First 16 bytes:', formatHex(data.slice(0, 16)));

  // Check if already decrypted
  if (isDecrypted(data)) {
    console.log('[PES-DECRYPT] File appears already decrypted');
    return { success: true, data, version: 'decrypted', compressed: false };
  }

  // Try each PES version key
  for (const [version, key] of Object.entries(PES_KEYS)) {
    console.log(`[PES-DECRYPT] Trying ${version}...`);
    
    const result = tryBlowfishDecrypt(data, key, version);
    if (result.success) {
      console.log(`[PES-DECRYPT] ✅ ${version} SUCCESS!`);
      
      // Check if result is zlib compressed
      if (isZlibCompressed(result.data)) {
        console.log('[PES-DECRYPT] Data is zlib compressed, decompressing...');
        try {
          const decompressed = pako.inflate(result.data);
          return { 
            success: true, 
            data: decompressed, 
            version, 
            compressed: true 
          };
        } catch (e) {
          console.log('[PES-DECRYPT] Decompression failed, using raw decrypted data');
        }
      }
      
      return result;
    }
  }

  // Try alternative methods
  const altResult = tryAlternativeDecryption(data);
  if (altResult.success) {
    return altResult;
  }

  console.warn('[PES-DECRYPT] All decryption methods failed');
  return { success: false, data, version: 'unknown', compressed: false };
}

function tryBlowfishDecrypt(
  data: Uint8Array, 
  key: Uint8Array, 
  version: string
): DecryptResult {
  try {
    // Use first 16 bytes of key for Blowfish (128-bit key)
    const bfKey = key.slice(0, 16);
    const bf = new Blowfish(bfKey);

    // Decrypt in ECB mode (8-byte blocks)
    const decrypted = new Uint8Array(data.length);
    const blockSize = 8;
    
    // Process 8-byte blocks
    for (let i = 0; i + blockSize <= data.length; i += blockSize) {
      const block = data.slice(i, i + blockSize);
      const decryptedBlock = decryptBlock(bf, block);
      decrypted.set(decryptedBlock, i);
    }
    
    // Copy remaining bytes (if not block-aligned)
    const remainder = data.length % blockSize;
    if (remainder > 0) {
      decrypted.set(data.slice(data.length - remainder), data.length - remainder);
    }

    // Validate result
    if (isValidDecryptedData(decrypted)) {
      return { success: true, data: decrypted, version, compressed: false };
    }

    // Try with different endianness
    const decryptedLE = decryptWithEndianness(bf, data, true);
    if (isValidDecryptedData(decryptedLE)) {
      return { success: true, data: decryptedLE, version, compressed: false };
    }

    const decryptedBE = decryptWithEndianness(bf, data, false);
    if (isValidDecryptedData(decryptedBE)) {
      return { success: true, data: decryptedBE, version, compressed: false };
    }

  } catch (e) {
    console.log(`[PES-DECRYPT] Error with ${version}:`, e);
  }

  return { success: false, data, version, compressed: false };
}

function decryptBlock(bf: Blowfish, block: Uint8Array): Uint8Array {
  const view = new DataView(block.buffer, block.byteOffset, 8);
  const left = view.getUint32(0, false);  // Big-endian as per Blowfish standard
  const right = view.getUint32(4, false);
  
  const [dl, dr] = bf.decryptBlock(left, right);
  
  const result = new Uint8Array(8);
  const outView = new DataView(result.buffer);
  outView.setUint32(0, dl, false);
  outView.setUint32(4, dr, false);
  
  return result;
}

function decryptWithEndianness(
  bf: Blowfish, 
  data: Uint8Array, 
  littleEndian: boolean
): Uint8Array {
  const decrypted = new Uint8Array(data.length);
  const blockSize = 8;
  
  for (let i = 0; i + blockSize <= data.length; i += blockSize) {
    const view = new DataView(data.buffer, data.byteOffset + i, 8);
    const left = view.getUint32(0, littleEndian);
    const right = view.getUint32(4, littleEndian);
    
    const [dl, dr] = bf.decryptBlock(left, right);
    
    const outView = new DataView(decrypted.buffer, i, 8);
    outView.setUint32(0, dl, littleEndian);
    outView.setUint32(4, dr, littleEndian);
  }
  
  // Copy remainder
  const remainder = data.length % blockSize;
  if (remainder > 0) {
    decrypted.set(data.slice(data.length - remainder), data.length - remainder);
  }
  
  return decrypted;
}

function tryAlternativeDecryption(data: Uint8Array): DecryptResult {
  console.log('[PES-DECRYPT] Trying alternative methods...');

  // Method: XOR with header as key (pesXdecrypter fallback)
  const view = new DataView(data.buffer, data.byteOffset);
  const headerKey = view.getUint32(0, true);
  
  // Try simple XOR
  const xorResult = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i += 4) {
    if (i + 4 <= data.length) {
      const val = view.getUint32(i, true);
      const xored = val ^ headerKey;
      new DataView(xorResult.buffer).setUint32(i, xored, true);
    }
  }
  
  if (isValidDecryptedData(xorResult)) {
    return { success: true, data: xorResult, version: 'XOR', compressed: false };
  }

  // Method: Try with known magic XOR
  const knownMagics = [0xE905149D, 0xAD5651CA, 0xBD4C50D8];
  
  for (const magic of knownMagics) {
    const result = new Uint8Array(data.length);
    const seed = headerKey ^ magic;
    
    // Generate XOR stream
    let key = seed;
    for (let i = 0; i < data.length; i += 4) {
      if (i + 4 <= data.length) {
        const val = view.getUint32(i, true);
        new DataView(result.buffer).setUint32(i, val ^ key, true);
        // LCG-style key update
        key = ((key * 0x41C64E6D) + 0x3039) >>> 0;
      }
    }
    
    if (isValidDecryptedData(result)) {
      return { success: true, data: result, version: `Magic-${magic.toString(16)}`, compressed: false };
    }
  }

  return { success: false, data, version: 'unknown', compressed: false };
}

function isDecrypted(data: Uint8Array): boolean {
  // Check for known decrypted file signatures
  for (const [name, sig] of Object.entries(SIGNATURES)) {
    if (name === 'ZLIB' || name === 'ZLIB2') continue;
    if (matchesSignature(data, sig)) {
      console.log(`[PES-DECRYPT] Matches ${name} signature`);
      return true;
    }
  }
  return false;
}

function isZlibCompressed(data: Uint8Array): boolean {
  return matchesSignature(data, SIGNATURES.ZLIB) || 
         matchesSignature(data, SIGNATURES.ZLIB2);
}

function matchesSignature(data: Uint8Array, sig: number[]): boolean {
  if (data.length < sig.length) return false;
  for (let i = 0; i < sig.length; i++) {
    if (data[i] !== sig[i]) return false;
  }
  return true;
}

function isValidDecryptedData(data: Uint8Array): boolean {
  if (data.length < 16) return false;

  // Check for known signatures
  if (isDecrypted(data)) return true;

  // Check for readable content (player names, etc.)
  let readableCount = 0;
  let utf16Strings = 0;
  
  // Look for UTF-16LE patterns (player names)
  for (let i = 0; i < Math.min(50000, data.length - 10); i += 2) {
    // Capital letter followed by null byte = UTF-16LE
    if (data[i] >= 0x41 && data[i] <= 0x5A && data[i + 1] === 0) {
      let validChars = 0;
      for (let j = 0; j < 20 && (i + j * 2 + 1) < data.length; j++) {
        const char = data[i + j * 2];
        const high = data[i + j * 2 + 1];
        if (high !== 0) break;
        if (char === 0) break;
        if ((char >= 0x41 && char <= 0x5A) || (char >= 0x61 && char <= 0x7A) || char === 0x20) {
          validChars++;
        } else {
          break;
        }
      }
      if (validChars >= 3) {
        utf16Strings++;
        if (utf16Strings >= 3) {
          console.log('[PES-DECRYPT] Found UTF-16LE strings');
          return true;
        }
      }
    }
    
    // Also count ASCII readable bytes
    if (data[i] >= 0x20 && data[i] < 0x7F) {
      readableCount++;
    }
  }

  // If significant portion is readable
  const readableRatio = readableCount / Math.min(50000, data.length);
  if (readableRatio > 0.3) {
    console.log(`[PES-DECRYPT] Readable ratio: ${(readableRatio * 100).toFixed(1)}%`);
    return true;
  }

  return false;
}

function formatHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join(' ');
}

// Export encryption function (for saving files)
export async function encryptPesFile(
  data: Uint8Array, 
  version: string = 'PES2021'
): Promise<Uint8Array> {
  const key = PES_KEYS[version];
  if (!key) {
    console.warn(`[PES-ENCRYPT] Unknown version ${version}, using PES2021`);
    return encryptPesFile(data, 'PES2021');
  }

  const bfKey = key.slice(0, 16);
  const bf = new Blowfish(bfKey);

  const encrypted = new Uint8Array(data.length);
  const blockSize = 8;

  for (let i = 0; i + blockSize <= data.length; i += blockSize) {
    const view = new DataView(data.buffer, data.byteOffset + i, 8);
    const left = view.getUint32(0, false);
    const right = view.getUint32(4, false);
    
    const [el, er] = bf.encryptBlock(left, right);
    
    const outView = new DataView(encrypted.buffer, i, 8);
    outView.setUint32(0, el, false);
    outView.setUint32(4, er, false);
  }

  const remainder = data.length % blockSize;
  if (remainder > 0) {
    encrypted.set(data.slice(data.length - remainder), data.length - remainder);
  }

  return encrypted;
}
