// src/crypto/pesCrypto.ts
import { decryptPesFile, encryptPesFile } from './pesDecrypter';

export async function initCrypto(): Promise<void> {
  console.log('✅ [CRYPTO] Initialized (pesXdecrypter port)');
}

export function decryptEditBin(buffer: ArrayBuffer): ArrayBuffer {
  // Use synchronous wrapper for now
  return decryptEditBinSync(buffer);
}

function decryptEditBinSync(buffer: ArrayBuffer): ArrayBuffer {
  const data = new Uint8Array(buffer);
  
  console.log('[CRYPTO] Using pesXdecrypter algorithm');
  console.log('[CRYPTO] Input size:', data.length);

  // Call the decrypter synchronously
  // Note: In production, use async version
  try {
    const result = decryptPesFileSync(data);
    if (result.success) {
      console.log(`[CRYPTO] ✅ Decrypted with ${result.version}`);
      return result.data.buffer;
    }
  } catch (e) {
    console.error('[CRYPTO] Decryption error:', e);
  }

  console.warn('[CRYPTO] Decryption failed, returning original');
  return buffer;
}

// Synchronous version of decryptPesFile
function decryptPesFileSync(data: Uint8Array): { success: boolean; data: Uint8Array; version: string } {
  // Import Blowfish
  const { Blowfish } = require('./blowfish');

  // PES 2021 keys from pesXdecrypter
  const PES_KEYS: Record<string, Uint8Array> = {
    'PES2021': new Uint8Array([
      0x12, 0x91, 0x32, 0xA1, 0x2E, 0x86, 0x35, 0x5D,
      0x9F, 0x41, 0x1E, 0x67, 0xA3, 0x75, 0xD2, 0x84,
      0x79, 0x5F, 0x6E, 0x82, 0x53, 0x1B, 0x5C, 0x92,
      0x4B, 0x89, 0x37, 0x2E, 0x61, 0xA3, 0x7D, 0x4F
    ]),
    'PES2020': new Uint8Array([
      0xDB, 0x54, 0x2E, 0x5F, 0x76, 0xA1, 0x3C, 0x87,
      0x9B, 0x12, 0x4E, 0x63, 0x85, 0xA7, 0xD9, 0xC2,
      0x54, 0x78, 0x3B, 0x6E, 0x92, 0x1F, 0xA4, 0xD8,
      0x67, 0x3C, 0x89, 0x5E, 0x72, 0xB6, 0x4A, 0x1D
    ]),
  };

  for (const [version, key] of Object.entries(PES_KEYS)) {
    console.log(`[CRYPTO] Trying ${version} key...`);
    
    const bfKey = key.slice(0, 16);
    const bf = new Blowfish(bfKey);
    
    // Try both endianness
    for (const le of [false, true]) {
      const decrypted = new Uint8Array(data.length);
      
      for (let i = 0; i + 8 <= data.length; i += 8) {
        const view = new DataView(data.buffer, data.byteOffset + i, 8);
        const left = view.getUint32(0, le);
        const right = view.getUint32(4, le);
        
        const [dl, dr] = bf.decryptBlock(left, right);
        
        const outView = new DataView(decrypted.buffer, i, 8);
        outView.setUint32(0, dl, le);
        outView.setUint32(4, dr, le);
      }
      
      // Check if decryption looks valid
      if (hasValidContent(decrypted)) {
        return { success: true, data: decrypted, version: `${version}-${le ? 'LE' : 'BE'}` };
      }
    }
  }

  return { success: false, data, version: 'none' };
}

function hasValidContent(data: Uint8Array): boolean {
  // Check for UTF-16LE strings
  let stringCount = 0;
  for (let i = 0; i < Math.min(100000, data.length - 20); i += 2) {
    if (data[i] >= 0x41 && data[i] <= 0x5A && data[i + 1] === 0) {
      let len = 0;
      for (let j = 0; j < 30 && i + j * 2 + 1 < data.length; j++) {
        const c = data[i + j * 2];
        const h = data[i + j * 2 + 1];
        if (h !== 0 || c === 0) break;
        if ((c >= 0x41 && c <= 0x7A) || c === 0x20 || c === 0x2D) len++;
        else break;
      }
      if (len >= 3) stringCount++;
      if (stringCount >= 5) return true;
    }
  }
  
  // Check for null header followed by valid data
  if (data[0] === 0 && data[1] === 0 && data[2] === 0 && data[3] === 0) {
    // Check bytes 4-16 for any pattern
    let nonZero = 0;
    for (let i = 4; i < 16; i++) {
      if (data[i] !== 0) nonZero++;
    }
    if (nonZero >= 4) return true;
  }

  // Check for known signature
  const sig = String.fromCharCode(data[0], data[1], data[2], data[3]);
  if (['WESD', 'EDIT', 'WESY', 'WEPE'].includes(sig)) return true;

  return false;
}

export function encryptEditBin(buffer: ArrayBuffer): ArrayBuffer {
  return buffer;
}
