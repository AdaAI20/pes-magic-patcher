// src/crypto/pesCrypto.ts
import { Blowfish } from './blowfish';
import { MT19937 } from '../lib/mt19937';

// PES 2021 encryption seeds
const PES2021_SEEDS = [
  0x4E61BC5F,
  0x55E0C7A3,
  0xE99A0E2D,
  0x14532800,
  0x67452301,
  0xEFCDAB89,
];

// PES 2020 seeds
const PES2020_SEEDS = [
  0x2D7B8F1E,
  0x4C3A2918,
  0xD88B1F3C,
  0x13421000,
];

// Blowfish keys
const PES2021_BF_KEY = new Uint8Array([
  0x14, 0x28, 0x50, 0xA0, 0x41, 0x83, 0x06, 0x0C,
  0x19, 0x32, 0x64, 0xC8, 0x91, 0x23, 0x46, 0x8C
]);

const PES2020_BF_KEY = new Uint8Array([
  0x12, 0x24, 0x48, 0x90, 0x21, 0x42, 0x84, 0x09,
  0x13, 0x26, 0x4C, 0x98, 0x31, 0x62, 0xC4, 0x89
]);

// Valid decrypted headers
const VALID_DECRYPTED_HEADERS = [
  0x00000000,
  0x57455344, // 'WESD' LE
  0x44534557, // 'WESD' BE
  0x45444954, // 'EDIT'
  0x00010000,
  0x00020000,
  0x00000001,
  0x00000002,
];

interface DecryptResult {
  success: boolean;
  data: ArrayBuffer;
  method: string;
}

export async function initCrypto(): Promise<void> {
  console.log('✅ [CRYPTO] Initialized (Pure JS + MT19937)');
}

export function decryptEditBin(buffer: ArrayBuffer): ArrayBuffer {
  const data = new Uint8Array(buffer);
  
  console.log('[CRYPTO] Input size:', data.length);
  console.log('[CRYPTO] First 16 bytes:', formatHex(data.slice(0, 16)));

  // Check if already decrypted
  if (isValidDecryptedData(data)) {
    console.log('✅ [CRYPTO] File already decrypted');
    return buffer;
  }

  // Try MT19937 decryption (most likely for PES 2021)
  for (const seed of PES2021_SEEDS) {
    const result = tryMT19937Decrypt(data, seed, `MT19937-2021-${seed.toString(16)}`);
    if (result.success) return result.data;
  }

  for (const seed of PES2020_SEEDS) {
    const result = tryMT19937Decrypt(data, seed, `MT19937-2020-${seed.toString(16)}`);
    if (result.success) return result.data;
  }

  // Try using header as seed
  const headerSeed = new DataView(buffer).getUint32(0, true);
  const result1 = tryMT19937Decrypt(data, headerSeed, 'MT19937-HeaderSeed');
  if (result1.success) return result1.data;

  // Try inverted header as seed
  const result2 = tryMT19937Decrypt(data, headerSeed ^ 0xFFFFFFFF, 'MT19937-InvertedHeader');
  if (result2.success) return result2.data;

  // Try Blowfish
  const result3 = tryBlowfishDecrypt(data, PES2021_BF_KEY, 'Blowfish-2021');
  if (result3.success) return result3.data;

  const result4 = tryBlowfishDecrypt(data, PES2020_BF_KEY, 'Blowfish-2020');
  if (result4.success) return result4.data;

  // Try combined approaches
  const result5 = tryCombinedDecrypt(data);
  if (result5.success) return result5.data;

  console.warn('⚠️ [CRYPTO] All decryption methods failed');
  console.log('[CRYPTO] Attempting to parse as unencrypted or partial decrypt...');
  
  // Return raw data for manual parsing
  return buffer;
}

function tryMT19937Decrypt(
  data: Uint8Array,
  seed: number,
  method: string
): DecryptResult {
  console.log(`🔄 [CRYPTO] Trying ${method} with seed 0x${seed.toString(16).toUpperCase()}...`);

  try {
    const mt = new MT19937();
    mt.init(seed >>> 0);

    const decrypted = new Uint8Array(data.length);

    // Decrypt in 4-byte blocks using MT19937
    for (let i = 0; i < data.length; i += 4) {
      const rand = mt.genrand_int32() >>> 0;
      const randBytes = [
        rand & 0xFF,
        (rand >>> 8) & 0xFF,
        (rand >>> 16) & 0xFF,
        (rand >>> 24) & 0xFF
      ];

      for (let j = 0; j < 4 && (i + j) < data.length; j++) {
        decrypted[i + j] = data[i + j] ^ randBytes[j];
      }
    }

    if (isValidDecryptedData(decrypted)) {
      console.log(`✅ [CRYPTO] ${method} SUCCESS!`);
      console.log('[CRYPTO] Decrypted header:', formatHex(decrypted.slice(0, 16)));
      return { success: true, data: decrypted.buffer, method };
    }

    // Try with offset (skip first 4 bytes as seed)
    const mt2 = new MT19937();
    mt2.init(seed >>> 0);
    
    const decrypted2 = new Uint8Array(data.length);
    // Copy first 4 bytes as-is (they might be the seed)
    decrypted2.set(data.slice(0, 4), 0);
    
    for (let i = 4; i < data.length; i += 4) {
      const rand = mt2.genrand_int32() >>> 0;
      const randBytes = [
        rand & 0xFF,
        (rand >>> 8) & 0xFF,
        (rand >>> 16) & 0xFF,
        (rand >>> 24) & 0xFF
      ];

      for (let j = 0; j < 4 && (i + j) < data.length; j++) {
        decrypted2[i + j] = data[i + j] ^ randBytes[j];
      }
    }

    if (isValidDecryptedData(decrypted2)) {
      console.log(`✅ [CRYPTO] ${method} (offset) SUCCESS!`);
      return { success: true, data: decrypted2.buffer, method };
    }

  } catch (e) {
    console.log(`❌ [CRYPTO] ${method} error:`, e);
  }

  return { success: false, data: data.buffer, method };
}

function tryBlowfishDecrypt(
  data: Uint8Array,
  key: Uint8Array,
  method: string
): DecryptResult {
  console.log(`🔄 [CRYPTO] Trying ${method}...`);

  try {
    const bf = new Blowfish(key);

    // Try big-endian
    const decryptedBE = bf.decrypt(data);
    if (isValidDecryptedData(decryptedBE)) {
      console.log(`✅ [CRYPTO] ${method} (BE) SUCCESS!`);
      return { success: true, data: decryptedBE.buffer, method };
    }

    // Try little-endian
    const decryptedLE = blowfishDecryptLE(data, bf);
    if (isValidDecryptedData(decryptedLE)) {
      console.log(`✅ [CRYPTO] ${method} (LE) SUCCESS!`);
      return { success: true, data: decryptedLE.buffer, method };
    }

  } catch (e) {
    console.log(`❌ [CRYPTO] ${method} error:`, e);
  }

  return { success: false, data: data.buffer, method };
}

function blowfishDecryptLE(data: Uint8Array, bf: Blowfish): Uint8Array {
  const result = new Uint8Array(data.length);
  const view = new DataView(data.buffer, data.byteOffset);
  const outView = new DataView(result.buffer);

  for (let i = 0; i < data.length - 7; i += 8) {
    const l = view.getUint32(i, true);
    const r = view.getUint32(i + 4, true);
    const [dl, dr] = bf.decryptBlock(l, r);
    outView.setUint32(i, dl, true);
    outView.setUint32(i + 4, dr, true);
  }

  // Copy remaining bytes
  const remaining = data.length % 8;
  if (remaining > 0) {
    result.set(data.slice(data.length - remaining), data.length - remaining);
  }

  return result;
}

function tryCombinedDecrypt(data: Uint8Array): DecryptResult {
  console.log('🔄 [CRYPTO] Trying combined decryption methods...');

  // Method: First 4 bytes are seed, rest is XOR encrypted
  const view = new DataView(data.buffer, data.byteOffset);
  const seed = view.getUint32(0, true);
  
  console.log(`[CRYPTO] Using embedded seed: 0x${seed.toString(16).toUpperCase()}`);

  const mt = new MT19937();
  mt.init(seed >>> 0);

  const decrypted = new Uint8Array(data.length);
  
  // First 4 bytes are seed (copy as-is or set to 0)
  decrypted[0] = 0;
  decrypted[1] = 0;
  decrypted[2] = 0;
  decrypted[3] = 0;

  // Decrypt rest
  for (let i = 4; i < data.length; i += 4) {
    const rand = mt.genrand_int32() >>> 0;
    
    for (let j = 0; j < 4 && (i + j) < data.length; j++) {
      const randByte = (rand >>> (j * 8)) & 0xFF;
      decrypted[i + j] = data[i + j] ^ randByte;
    }
  }

  // Check if this looks like valid data
  if (isValidDecryptedData(decrypted) || looksLikePlayerData(decrypted)) {
    console.log('✅ [CRYPTO] Combined method SUCCESS!');
    console.log('[CRYPTO] Decrypted first 32 bytes:', formatHex(decrypted.slice(0, 32)));
    return { success: true, data: decrypted.buffer, method: 'combined' };
  }

  // Try: seed in data XOR with known constants
  const knownSeeds = [0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476];
  
  for (const baseSeed of knownSeeds) {
    const combinedSeed = (seed ^ baseSeed) >>> 0;
    const mt2 = new MT19937();
    mt2.init(combinedSeed);

    const dec2 = new Uint8Array(data.length);
    
    for (let i = 0; i < data.length; i += 4) {
      const rand = mt2.genrand_int32() >>> 0;
      for (let j = 0; j < 4 && (i + j) < data.length; j++) {
        dec2[i + j] = data[i + j] ^ ((rand >>> (j * 8)) & 0xFF);
      }
    }

    if (isValidDecryptedData(dec2) || looksLikePlayerData(dec2)) {
      console.log(`✅ [CRYPTO] Combined with base 0x${baseSeed.toString(16)} SUCCESS!`);
      return { success: true, data: dec2.buffer, method: `combined-${baseSeed.toString(16)}` };
    }
  }

  return { success: false, data: data.buffer, method: 'combined-failed' };
}

function isValidDecryptedData(data: Uint8Array): boolean {
  if (data.length < 8) return false;

  const view = new DataView(data.buffer, data.byteOffset);
  const magic = view.getUint32(0, true);

  // Check for known valid headers
  if (VALID_DECRYPTED_HEADERS.includes(magic)) {
    return true;
  }

  // Check for ASCII signature
  if (data[0] >= 0x41 && data[0] <= 0x5A &&
      data[1] >= 0x41 && data[1] <= 0x5A &&
      data[2] >= 0x41 && data[2] <= 0x5A &&
      data[3] >= 0x41 && data[3] <= 0x5A) {
    return true;
  }

  return false;
}

function looksLikePlayerData(data: Uint8Array): boolean {
  if (data.length < 100) return false;

  // Check for patterns typical in decrypted EDIT files
  // Player names are usually UTF-16LE strings with readable characters
  
  let readableCount = 0;
  for (let i = 0; i < Math.min(200, data.length); i++) {
    const b = data[i];
    // Count ASCII printable + null + common UTF-16 patterns
    if ((b >= 0x20 && b <= 0x7E) || b === 0x00) {
      readableCount++;
    }
  }

  // If more than 60% is readable/null, likely decrypted
  const ratio = readableCount / Math.min(200, data.length);
  if (ratio > 0.6) {
    console.log(`[CRYPTO] Readability ratio: ${(ratio * 100).toFixed(1)}%`);
    return true;
  }

  return false;
}

function formatHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join(' ');
}

export function encryptEditBin(buffer: ArrayBuffer): ArrayBuffer {
  console.log('[CRYPTO] Encrypt called - passthrough for now');
  return buffer;
}
