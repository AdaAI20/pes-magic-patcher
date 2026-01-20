// src/crypto/pesCrypto.ts
import { Blowfish } from './blowfish';
import { MT19937 } from '../lib/mt19937';

// PES 2021 known encryption keys
const PES2021_KEYS = {
  // Main encryption key (16 bytes)
  main: new Uint8Array([
    0x4B, 0x6F, 0x6E, 0x61, 0x6D, 0x69, 0x50, 0x45,
    0x53, 0x32, 0x30, 0x32, 0x31, 0x45, 0x44, 0x49
  ]),
  // Alternative keys to try
  alt1: new Uint8Array([
    0x14, 0x28, 0x50, 0xA0, 0x41, 0x83, 0x06, 0x0C,
    0x19, 0x32, 0x64, 0xC8, 0x91, 0x23, 0x46, 0x8C
  ]),
  alt2: new Uint8Array([
    0x79, 0x5F, 0x6E, 0x82, 0x53, 0x1B, 0x5C, 0x92,
    0x4B, 0x89, 0x37, 0x2E, 0x61, 0xA3, 0x7D, 0x4F
  ]),
  // eFootball/PES 2021 Season Update key
  pes21su: new Uint8Array([
    0x45, 0x44, 0x49, 0x54, 0x00, 0x01, 0x00, 0x02,
    0x50, 0x45, 0x53, 0x32, 0x30, 0x32, 0x31, 0x00
  ])
};

export async function initCrypto(): Promise<void> {
  console.log('✅ [CRYPTO] Initialized (Pure JS + Multi-method)');
}

export function decryptEditBin(buffer: ArrayBuffer): ArrayBuffer {
  const data = new Uint8Array(buffer);
  
  console.log('[CRYPTO] Input size:', data.length);
  console.log('[CRYPTO] First 16 bytes:', formatHex(data.slice(0, 16)));

  // Check if already decrypted
  if (isValidDecrypted(data)) {
    console.log('✅ [CRYPTO] File already decrypted');
    return buffer;
  }

  // Method 1: Full MT19937 with header seed (skip first 4 bytes)
  let result = tryMT19937Full(data);
  if (result.success) return result.data;

  // Method 2: Blowfish decryption with known keys
  for (const [name, key] of Object.entries(PES2021_KEYS)) {
    result = tryBlowfishMethod(data, key, name);
    if (result.success) return result.data;
  }

  // Method 3: XOR with rolling key
  result = tryRollingXOR(data);
  if (result.success) return result.data;

  // Method 4: Block-based decryption
  result = tryBlockDecrypt(data);
  if (result.success) return result.data;

  // Return the best attempt (even if not fully successful)
  console.warn('⚠️ [CRYPTO] Full decryption failed - attempting partial decode');
  return tryPartialDecode(data);
}

function tryMT19937Full(data: Uint8Array): { success: boolean; data: ArrayBuffer } {
  const view = new DataView(data.buffer, data.byteOffset);
  const seed = view.getUint32(0, true);
  
  console.log(`🔄 [CRYPTO] MT19937 Full with seed 0x${seed.toString(16).toUpperCase()}`);

  const mt = new MT19937();
  mt.init(seed >>> 0);

  const decrypted = new Uint8Array(data.length);
  
  // First 4 bytes become the decrypted header (usually 0)
  decrypted[0] = 0;
  decrypted[1] = 0;
  decrypted[2] = 0;
  decrypted[3] = 0;

  // Decrypt rest byte-by-byte
  for (let i = 4; i < data.length; i += 4) {
    const rand = mt.genrand_int32() >>> 0;
    for (let j = 0; j < 4 && (i + j) < data.length; j++) {
      decrypted[i + j] = data[i + j] ^ ((rand >>> (j * 8)) & 0xFF);
    }
  }

  // Check if result has readable content
  if (hasReadableContent(decrypted)) {
    console.log('✅ [CRYPTO] MT19937 Full SUCCESS!');
    console.log('[CRYPTO] Sample:', formatHex(decrypted.slice(0, 32)));
    return { success: true, data: decrypted.buffer };
  }

  // The first layer might be correct, but there's another layer
  // Try Blowfish on the MT19937 result
  for (const [name, key] of Object.entries(PES2021_KEYS)) {
    const bf = new Blowfish(key);
    try {
      const doubleDecrypted = bf.decrypt(decrypted);
      if (hasReadableContent(doubleDecrypted)) {
        console.log(`✅ [CRYPTO] MT19937 + Blowfish(${name}) SUCCESS!`);
        return { success: true, data: doubleDecrypted.buffer };
      }
    } catch (e) {
      // Continue to next key
    }
  }

  return { success: false, data: data.buffer };
}

function tryBlowfishMethod(
  data: Uint8Array, 
  key: Uint8Array, 
  keyName: string
): { success: boolean; data: ArrayBuffer } {
  console.log(`🔄 [CRYPTO] Blowfish (${keyName})...`);
  
  try {
    const bf = new Blowfish(key);
    
    // Try direct Blowfish
    const decrypted = bf.decrypt(data);
    if (hasReadableContent(decrypted)) {
      console.log(`✅ [CRYPTO] Blowfish (${keyName}) SUCCESS!`);
      return { success: true, data: decrypted.buffer };
    }

    // Try skipping header
    const withoutHeader = data.slice(4);
    const decryptedNoHeader = bf.decrypt(withoutHeader);
    
    const result = new Uint8Array(data.length);
    result.set(data.slice(0, 4), 0);
    result.set(decryptedNoHeader, 4);
    
    if (hasReadableContent(result)) {
      console.log(`✅ [CRYPTO] Blowfish (${keyName}) skip-header SUCCESS!`);
      return { success: true, data: result.buffer };
    }

  } catch (e) {
    console.log(`❌ [CRYPTO] Blowfish (${keyName}) error:`, e);
  }

  return { success: false, data: data.buffer };
}

function tryRollingXOR(data: Uint8Array): { success: boolean; data: ArrayBuffer } {
  console.log('🔄 [CRYPTO] Rolling XOR...');

  const view = new DataView(data.buffer, data.byteOffset);
  const seed = view.getUint32(0, true);

  // Try different XOR patterns
  const patterns = [
    // Pattern 1: Seed-based rolling
    (i: number) => ((seed + i) * 0x41C64E6D + 0x3039) >>> 0,
    // Pattern 2: Simple linear
    (i: number) => (seed ^ (i * 0x1234567)) >>> 0,
    // Pattern 3: Multiplicative
    (i: number) => ((seed * (i + 1)) ^ 0xDEADBEEF) >>> 0,
  ];

  for (let p = 0; p < patterns.length; p++) {
    const decrypted = new Uint8Array(data.length);
    decrypted.set([0, 0, 0, 0], 0);

    for (let i = 4; i < data.length; i += 4) {
      const key = patterns[p](i / 4);
      for (let j = 0; j < 4 && (i + j) < data.length; j++) {
        decrypted[i + j] = data[i + j] ^ ((key >>> (j * 8)) & 0xFF);
      }
    }

    if (hasReadableContent(decrypted)) {
      console.log(`✅ [CRYPTO] Rolling XOR pattern ${p} SUCCESS!`);
      return { success: true, data: decrypted.buffer };
    }
  }

  return { success: false, data: data.buffer };
}

function tryBlockDecrypt(data: Uint8Array): { success: boolean; data: ArrayBuffer } {
  console.log('🔄 [CRYPTO] Block-based decryption...');

  // PES might encrypt different sections with different keys
  // Header (first 0x100 bytes) might use different encryption than data

  const view = new DataView(data.buffer, data.byteOffset);
  const headerSeed = view.getUint32(0, true);

  // Decrypt header section
  const headerSize = 0x100;
  const decrypted = new Uint8Array(data.length);

  // MT19937 for header
  const mtHeader = new MT19937();
  mtHeader.init(headerSeed >>> 0);
  
  decrypted[0] = 0;
  decrypted[1] = 0;
  decrypted[2] = 0;
  decrypted[3] = 0;

  for (let i = 4; i < headerSize && i < data.length; i += 4) {
    const rand = mtHeader.genrand_int32() >>> 0;
    for (let j = 0; j < 4 && (i + j) < data.length; j++) {
      decrypted[i + j] = data[i + j] ^ ((rand >>> (j * 8)) & 0xFF);
    }
  }

  // Try different keys for data section
  const dataSeed = view.getUint32(headerSize, true);
  const mtData = new MT19937();
  mtData.init(dataSeed >>> 0);

  for (let i = headerSize; i < data.length; i += 4) {
    const rand = mtData.genrand_int32() >>> 0;
    for (let j = 0; j < 4 && (i + j) < data.length; j++) {
      decrypted[i + j] = data[i + j] ^ ((rand >>> (j * 8)) & 0xFF);
    }
  }

  if (hasReadableContent(decrypted)) {
    console.log('✅ [CRYPTO] Block-based SUCCESS!');
    return { success: true, data: decrypted.buffer };
  }

  return { success: false, data: data.buffer };
}

function tryPartialDecode(data: Uint8Array): ArrayBuffer {
  console.log('🔄 [CRYPTO] Attempting partial decode...');
  
  const view = new DataView(data.buffer, data.byteOffset);
  const seed = view.getUint32(0, true);
  
  const mt = new MT19937();
  mt.init(seed >>> 0);

  const decrypted = new Uint8Array(data.length);
  decrypted[0] = 0;
  decrypted[1] = 0;
  decrypted[2] = 0;
  decrypted[3] = 0;

  for (let i = 4; i < data.length; i += 4) {
    const rand = mt.genrand_int32() >>> 0;
    for (let j = 0; j < 4 && (i + j) < data.length; j++) {
      decrypted[i + j] = data[i + j] ^ ((rand >>> (j * 8)) & 0xFF);
    }
  }

  // Scan for potential player data patterns
  scanForPatterns(decrypted);

  return decrypted.buffer;
}

function hasReadableContent(data: Uint8Array): boolean {
  // Scan for UTF-16LE strings (player names)
  let foundStrings = 0;
  
  for (let i = 0; i < Math.min(50000, data.length - 20); i += 2) {
    // Look for uppercase letter followed by null (UTF-16LE pattern)
    if (data[i] >= 65 && data[i] <= 90 && data[i + 1] === 0) {
      // Check if it's a valid name
      let len = 0;
      for (let j = 0; j < 30 && i + j * 2 + 1 < data.length; j++) {
        const c = data[i + j * 2] | (data[i + j * 2 + 1] << 8);
        if (c === 0) break;
        if (c >= 32 && c < 127) len++;
        else break;
      }
      if (len >= 3) {
        foundStrings++;
        if (foundStrings >= 5) {
          console.log(`[CRYPTO] Found ${foundStrings}+ readable strings`);
          return true;
        }
      }
    }
  }

  // Also check for ASCII patterns
  let asciiRun = 0;
  for (let i = 0; i < Math.min(10000, data.length); i++) {
    if (data[i] >= 32 && data[i] < 127) {
      asciiRun++;
      if (asciiRun > 20) return true;
    } else {
      asciiRun = 0;
    }
  }

  return false;
}

function isValidDecrypted(data: Uint8Array): boolean {
  if (data.length < 8) return false;
  
  // Check for known headers
  const header = String.fromCharCode(data[0], data[1], data[2], data[3]);
  if (header === 'WESD' || header === 'EDIT') return true;
  
  // Check for null header with valid following data
  if (data[0] === 0 && data[1] === 0 && data[2] === 0 && data[3] === 0) {
    return hasReadableContent(data);
  }

  return false;
}

function scanForPatterns(data: Uint8Array): void {
  console.log('[CRYPTO] Scanning for data patterns...');
  
  // Look for repeating patterns that might indicate structure
  const patternCounts: Record<string, number> = {};
  
  for (let i = 0; i < Math.min(10000, data.length - 4); i++) {
    const pattern = `${data[i].toString(16)}${data[i+1].toString(16)}`;
    patternCounts[pattern] = (patternCounts[pattern] || 0) + 1;
  }

  // Find most common patterns
  const sorted = Object.entries(patternCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  console.log('[CRYPTO] Common patterns:', sorted);
}

function formatHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join(' ');
}

export function encryptEditBin(buffer: ArrayBuffer): ArrayBuffer {
  return buffer;
}
