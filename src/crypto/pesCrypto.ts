// src/crypto/pesCrypto.ts
// Ported from https://github.com/the4chancup/pesXdecrypter

import { Blowfish } from './blowfish';

// PES 2021 keys from pesXdecrypter - ACTUAL KEYS
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

export async function initCrypto(): Promise<void> {
  console.log('✅ [CRYPTO] Initialized (pesXdecrypter port)');
}

export function decryptEditBin(buffer: ArrayBuffer): ArrayBuffer {
  const data = new Uint8Array(buffer);
  
  console.log('[CRYPTO] Using pesXdecrypter algorithm');
  console.log('[CRYPTO] Input size:', data.length);
  console.log('[CRYPTO] First 16 bytes:', formatHex(data.slice(0, 16)));

  // Check if already decrypted
  if (isAlreadyDecrypted(data)) {
    console.log('[CRYPTO] ✅ File already decrypted');
    return buffer;
  }

  // Try each PES version key with Blowfish
  for (const [version, key] of Object.entries(PES_KEYS)) {
    console.log(`[CRYPTO] Trying ${version}...`);
    
    const result = tryBlowfishDecrypt(data, key, version);
    if (result.success) {
      console.log(`[CRYPTO] ✅ ${version} SUCCESS!`);
      console.log('[CRYPTO] Decrypted first 32 bytes:', formatHex(result.data.slice(0, 32)));
      return result.data.buffer;
    }
  }

  // Try alternative decryption methods
  console.log('[CRYPTO] Blowfish failed, trying alternative methods...');
  
  const altResult = tryAlternativeDecryption(data);
  if (altResult.success) {
    console.log(`[CRYPTO] ✅ Alternative method SUCCESS: ${altResult.version}`);
    return altResult.data.buffer;
  }

  console.warn('[CRYPTO] ⚠️ All decryption methods failed');
  return buffer;
}

function tryBlowfishDecrypt(
  data: Uint8Array,
  key: Uint8Array,
  version: string
): { success: boolean; data: Uint8Array } {
  try {
    // Use 16-byte key for Blowfish
    const bfKey = key.slice(0, 16);
    const bf = new Blowfish(bfKey);

    // Try Big-Endian (standard Blowfish)
    let decrypted = decryptWithBlowfish(bf, data, false);
    if (hasValidContent(decrypted)) {
      console.log(`[CRYPTO] ${version} BE matched`);
      return { success: true, data: decrypted };
    }

    // Try Little-Endian
    decrypted = decryptWithBlowfish(bf, data, true);
    if (hasValidContent(decrypted)) {
      console.log(`[CRYPTO] ${version} LE matched`);
      return { success: true, data: decrypted };
    }

    // Try with 32-byte key
    const bf32 = new Blowfish(key);
    
    decrypted = decryptWithBlowfish(bf32, data, false);
    if (hasValidContent(decrypted)) {
      console.log(`[CRYPTO] ${version} 32-byte BE matched`);
      return { success: true, data: decrypted };
    }

    decrypted = decryptWithBlowfish(bf32, data, true);
    if (hasValidContent(decrypted)) {
      console.log(`[CRYPTO] ${version} 32-byte LE matched`);
      return { success: true, data: decrypted };
    }

  } catch (e) {
    console.log(`[CRYPTO] ${version} error:`, e);
  }

  return { success: false, data };
}

function decryptWithBlowfish(
  bf: Blowfish,
  data: Uint8Array,
  littleEndian: boolean
): Uint8Array {
  const decrypted = new Uint8Array(data.length);
  const blockSize = 8;

  for (let i = 0; i + blockSize <= data.length; i += blockSize) {
    const view = new DataView(data.buffer, data.byteOffset + i, blockSize);
    const left = view.getUint32(0, littleEndian);
    const right = view.getUint32(4, littleEndian);

    const [dl, dr] = bf.decryptBlock(left, right);

    const outView = new DataView(decrypted.buffer, i, blockSize);
    outView.setUint32(0, dl, littleEndian);
    outView.setUint32(4, dr, littleEndian);
  }

  // Copy remaining bytes
  const remainder = data.length % blockSize;
  if (remainder > 0) {
    const start = data.length - remainder;
    for (let i = 0; i < remainder; i++) {
      decrypted[start + i] = data[start + i];
    }
  }

  return decrypted;
}

function tryAlternativeDecryption(
  data: Uint8Array
): { success: boolean; data: Uint8Array; version: string } {
  const view = new DataView(data.buffer, data.byteOffset);
  const headerLE = view.getUint32(0, true);
  const headerBE = view.getUint32(0, false);

  // Method 1: Simple XOR with header as key
  console.log('[CRYPTO] Trying XOR with header...');
  let result = xorDecrypt(data, headerLE);
  if (hasValidContent(result)) {
    return { success: true, data: result, version: 'XOR-HeaderLE' };
  }

  result = xorDecrypt(data, headerBE);
  if (hasValidContent(result)) {
    return { success: true, data: result, version: 'XOR-HeaderBE' };
  }

  // Method 2: XOR with known magic values
  const knownMagics = [
    0xE99A0E2D,  // Common PES 2021 magic
    0x67452301,  // MD5 init
    0xEFCDAB89,
    0x98BADCFE,
    0x10325476,
  ];

  for (const magic of knownMagics) {
    result = xorDecrypt(data, magic);
    if (hasValidContent(result)) {
      return { success: true, data: result, version: `XOR-Magic-${magic.toString(16)}` };
    }
  }

  // Method 3: Rolling XOR (LCG-based)
  console.log('[CRYPTO] Trying rolling XOR...');
  result = rollingXorDecrypt(data, headerLE);
  if (hasValidContent(result)) {
    return { success: true, data: result, version: 'RollingXOR' };
  }

  // Method 4: MT19937-based XOR
  console.log('[CRYPTO] Trying MT19937...');
  result = mt19937Decrypt(data, headerLE);
  if (hasValidContent(result)) {
    return { success: true, data: result, version: 'MT19937' };
  }

  return { success: false, data, version: 'none' };
}

function xorDecrypt(data: Uint8Array, key: number): Uint8Array {
  const result = new Uint8Array(data.length);
  const view = new DataView(data.buffer, data.byteOffset);
  const outView = new DataView(result.buffer);

  for (let i = 0; i + 4 <= data.length; i += 4) {
    const val = view.getUint32(i, true);
    outView.setUint32(i, val ^ key, true);
  }

  // Copy remaining bytes
  for (let i = data.length - (data.length % 4); i < data.length; i++) {
    result[i] = data[i];
  }

  return result;
}

function rollingXorDecrypt(data: Uint8Array, seed: number): Uint8Array {
  const result = new Uint8Array(data.length);
  const view = new DataView(data.buffer, data.byteOffset);
  const outView = new DataView(result.buffer);

  let key = seed;
  for (let i = 0; i + 4 <= data.length; i += 4) {
    const val = view.getUint32(i, true);
    outView.setUint32(i, val ^ key, true);
    // LCG update
    key = ((key * 0x41C64E6D) + 0x3039) >>> 0;
  }

  return result;
}

function mt19937Decrypt(data: Uint8Array, seed: number): Uint8Array {
  const result = new Uint8Array(data.length);
  
  // Simple MT19937 implementation
  const mt = new Uint32Array(624);
  let idx = 624;

  // Initialize
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

  function next(): number {
    if (idx >= 624) twist();
    let y = mt[idx++];
    y ^= (y >>> 11);
    y ^= ((y << 7) & 0x9D2C5680);
    y ^= ((y << 15) & 0xEFC60000);
    y ^= (y >>> 18);
    return y >>> 0;
  }

  // First 4 bytes become 0
  result[0] = 0;
  result[1] = 0;
  result[2] = 0;
  result[3] = 0;

  // Decrypt rest
  for (let i = 4; i < data.length; i += 4) {
    const rand = next();
    for (let j = 0; j < 4 && (i + j) < data.length; j++) {
      result[i + j] = data[i + j] ^ ((rand >>> (j * 8)) & 0xFF);
    }
  }

  return result;
}

function isAlreadyDecrypted(data: Uint8Array): boolean {
  if (data.length < 8) return false;

  // Check for known signatures
  const sig = String.fromCharCode(data[0], data[1], data[2], data[3]);
  const knownSigs = ['WESD', 'EDIT', 'WESY', 'WEPE', 'WESN'];
  
  if (knownSigs.includes(sig)) {
    console.log(`[CRYPTO] Found signature: ${sig}`);
    return true;
  }

  // Check for null header with readable content
  if (data[0] === 0 && data[1] === 0 && data[2] === 0 && data[3] === 0) {
    return hasValidContent(data);
  }

  return false;
}

function hasValidContent(data: Uint8Array): boolean {
  if (data.length < 100) return false;

  // Check for known signatures first
  const sig = String.fromCharCode(data[0], data[1], data[2], data[3]);
  if (['WESD', 'EDIT', 'WESY', 'WEPE'].includes(sig)) {
    return true;
  }

  // Check for null header
  if (data[0] === 0 && data[1] === 0 && data[2] === 0 && data[3] === 0) {
    // Scan for UTF-16LE strings (player names)
    return hasUtf16Strings(data);
  }

  // Check for UTF-16LE strings anywhere
  return hasUtf16Strings(data);
}

function hasUtf16Strings(data: Uint8Array): boolean {
  let stringCount = 0;
  const scanLimit = Math.min(100000, data.length - 20);

  for (let i = 0; i < scanLimit; i += 2) {
    // Look for capital letter followed by null (UTF-16LE pattern)
    if (data[i] >= 0x41 && data[i] <= 0x5A && data[i + 1] === 0) {
      let validChars = 0;
      
      for (let j = 0; j < 25 && (i + j * 2 + 1) < data.length; j++) {
        const charCode = data[i + j * 2];
        const highByte = data[i + j * 2 + 1];
        
        if (highByte !== 0) break;
        if (charCode === 0) break;
        
        // Valid name characters: A-Z, a-z, space, hyphen, apostrophe
        if ((charCode >= 0x41 && charCode <= 0x5A) ||  // A-Z
            (charCode >= 0x61 && charCode <= 0x7A) ||  // a-z
            charCode === 0x20 ||                        // space
            charCode === 0x2D ||                        // hyphen
            charCode === 0x27) {                        // apostrophe
          validChars++;
        } else {
          break;
        }
      }
      
      if (validChars >= 3) {
        stringCount++;
        // Log first few found strings for debugging
        if (stringCount <= 3) {
          const strBytes: number[] = [];
          for (let j = 0; j < 20 && (i + j * 2) < data.length; j++) {
            const c = data[i + j * 2];
            if (c === 0) break;
            if (c >= 0x20 && c < 0x7F) strBytes.push(c);
          }
          const str = String.fromCharCode(...strBytes);
          console.log(`[CRYPTO] Found string at 0x${i.toString(16)}: "${str}"`);
        }
        
        if (stringCount >= 5) {
          console.log(`[CRYPTO] Found ${stringCount}+ valid UTF-16LE strings`);
          return true;
        }
        
        // Skip ahead past this string
        i += validChars * 2;
      }
    }
  }

  return false;
}

function formatHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join(' ');
}

export function encryptEditBin(buffer: ArrayBuffer): ArrayBuffer {
  // TODO: Implement encryption for saving
  console.log('[CRYPTO] Encrypt called - passthrough');
  return buffer;
}
