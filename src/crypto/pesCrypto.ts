// src/crypto/pesCrypto.ts
import { Blowfish } from './blowfish';
import { PES2021_EDIT_KEY, PES2020_EDIT_KEY, XOR_KEYS } from './keys';

// Expected magic values after successful decryption
const VALID_MAGICS = [
  0x00000000,    // Null header
  0x57455344,    // 'WESD'
  0x45444954,    // 'EDIT'
  0xE99A0E2D,    // PES 2021 decrypted
  0x00010000,    // Version marker
];

interface DecryptResult {
  success: boolean;
  data: ArrayBuffer;
  version: string;
}

export async function initCrypto(): Promise<void> {
  console.log('✅ [CRYPTO] Initialized (Pure JS mode)');
}

export function decryptEditBin(buffer: ArrayBuffer): ArrayBuffer {
  const data = new Uint8Array(buffer);
  
  console.log('[CRYPTO] Input size:', data.length);
  console.log('[CRYPTO] First 16 bytes:', formatHex(data.slice(0, 16)));

  // Check if already decrypted
  if (isDecrypted(data)) {
    console.log('✅ [CRYPTO] File already decrypted');
    return buffer;
  }

  // Try PES 2021 decryption
  let result = tryBlowfishDecrypt(data, PES2021_EDIT_KEY, '2021');
  if (result.success) return result.data;

  // Try PES 2020 decryption
  result = tryBlowfishDecrypt(data, PES2020_EDIT_KEY, '2020');
  if (result.success) return result.data;

  // Try XOR decryption
  result = tryXorDecrypt(data, '2021');
  if (result.success) return result.data;

  result = tryXorDecrypt(data, '2020');
  if (result.success) return result.data;

  // Try simple header swap
  result = tryHeaderDecrypt(data);
  if (result.success) return result.data;

  console.warn('⚠️ [CRYPTO] All decryption methods failed, returning original');
  return buffer;
}

function tryBlowfishDecrypt(
  data: Uint8Array, 
  key: Uint8Array, 
  version: string
): DecryptResult {
  console.log(`🔄 [CRYPTO] Trying Blowfish ${version}...`);
  
  try {
    const bf = new Blowfish(key);
    const decrypted = bf.decrypt(data);
    
    if (isDecrypted(decrypted)) {
      console.log(`✅ [CRYPTO] Blowfish ${version} SUCCESS!`);
      return { success: true, data: decrypted.buffer, version };
    }
    
    // Try with little-endian blocks
    const decryptedLE = blowfishDecryptLE(data, key);
    if (isDecrypted(decryptedLE)) {
      console.log(`✅ [CRYPTO] Blowfish ${version} (LE) SUCCESS!`);
      return { success: true, data: decryptedLE.buffer, version };
    }
    
    console.log(`❌ [CRYPTO] Blowfish ${version} failed`);
  } catch (e) {
    console.log(`❌ [CRYPTO] Blowfish ${version} error:`, e);
  }
  
  return { success: false, data: data.buffer, version };
}

function blowfishDecryptLE(data: Uint8Array, key: Uint8Array): Uint8Array {
  const bf = new Blowfish(key);
  const result = new Uint8Array(data.length);
  const view = new DataView(data.buffer, data.byteOffset);
  const outView = new DataView(result.buffer);

  for (let i = 0; i < data.length - 7; i += 8) {
    const l = view.getUint32(i, true); // Little-endian
    const r = view.getUint32(i + 4, true);
    const [dl, dr] = bf.decryptBlock(l, r);
    outView.setUint32(i, dl, true);
    outView.setUint32(i + 4, dr, true);
  }

  return result;
}

function tryXorDecrypt(data: Uint8Array, version: '2021' | '2020'): DecryptResult {
  console.log(`🔄 [CRYPTO] Trying XOR ${version}...`);
  
  const keys = XOR_KEYS[version === '2021' ? 'PES2021' : 'PES2020'];
  const decrypted = new Uint8Array(data.length);
  const view = new DataView(data.buffer, data.byteOffset);
  const outView = new DataView(decrypted.buffer);

  // XOR first 8 bytes with header key
  for (let i = 0; i < Math.min(8, data.length); i += 4) {
    const val = view.getUint32(i, true);
    outView.setUint32(i, val ^ keys.header, true);
  }

  // Copy/XOR rest
  for (let i = 8; i < data.length; i += 4) {
    if (i + 4 <= data.length) {
      const val = view.getUint32(i, true);
      outView.setUint32(i, val ^ keys.player, true);
    } else {
      for (let j = i; j < data.length; j++) {
        decrypted[j] = data[j];
      }
    }
  }

  if (isDecrypted(decrypted)) {
    console.log(`✅ [CRYPTO] XOR ${version} SUCCESS!`);
    return { success: true, data: decrypted.buffer, version };
  }

  console.log(`❌ [CRYPTO] XOR ${version} failed`);
  return { success: false, data: data.buffer, version };
}

function tryHeaderDecrypt(data: Uint8Array): DecryptResult {
  console.log('🔄 [CRYPTO] Trying header analysis...');
  
  const view = new DataView(data.buffer, data.byteOffset);
  const header = view.getUint32(0, true);
  
  console.log(`[CRYPTO] Header value: 0x${header.toString(16).toUpperCase()}`);
  
  // Check if this is a known encrypted header pattern
  // and apply appropriate transformation
  
  return { success: false, data: data.buffer, version: 'unknown' };
}

function isDecrypted(data: Uint8Array): boolean {
  if (data.length < 4) return false;
  
  const view = new DataView(data.buffer, data.byteOffset);
  const magic = view.getUint32(0, true);
  
  // Check for valid magic numbers
  if (VALID_MAGICS.includes(magic)) {
    console.log(`[CRYPTO] Valid magic found: 0x${magic.toString(16).toUpperCase()}`);
    return true;
  }
  
  // Check for readable ASCII header
  const first4 = String.fromCharCode(data[0], data[1], data[2], data[3]);
  if (/^[A-Z]{4}$/.test(first4)) {
    console.log(`[CRYPTO] ASCII header found: ${first4}`);
    return true;
  }
  
  // Check for typical decrypted patterns
  // Player data usually starts with small values
  if (magic < 0x1000 && data[4] < 0x10) {
    return true;
  }
  
  return false;
}

function formatHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join(' ');
}

// Re-export for compatibility
export function encryptEditBin(buffer: ArrayBuffer): ArrayBuffer {
  // For now, return as-is (implement if needed)
  console.log('[CRYPTO] Encrypt called - passthrough');
  return buffer;
}
