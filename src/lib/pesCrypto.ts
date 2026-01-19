/**
 * PES Crypto Module - Full TypeScript Implementation
 * 
 * Port of the pesXdecrypter algorithm from C to TypeScript.
 * Based on the public domain code from https://github.com/the4chancup/pesXdecrypter
 * 
 * The PES 2021 EDIT file uses:
 * - Mersenne Twister MT19937 for PRNG
 * - 64-byte master key
 * - Multiple encrypted blocks with rolling key
 */

import { MT19937 } from './mt19937';

// PES 2021 Master Key (64 bytes)
export const MASTER_KEY_PES21 = new Uint8Array([
  0x90, 0x61, 0xD8, 0x66, 0x43, 0x77, 0x24, 0xF8,
  0x92, 0xBA, 0xB8, 0x71, 0x21, 0xC7, 0x60, 0x63,
  0xF0, 0x91, 0x9A, 0x7D, 0xED, 0x47, 0x80, 0xDE,
  0x51, 0xF5, 0xDD, 0xD1, 0x08, 0xFE, 0x32, 0x84,
  0xF5, 0x09, 0x92, 0x00, 0xB2, 0x3E, 0x88, 0x9F,
  0xEB, 0x24, 0x43, 0x05, 0x58, 0x76, 0x00, 0x22,
  0x9B, 0xFE, 0xEC, 0xF6, 0x50, 0x00, 0x29, 0xD3,
  0x42, 0x75, 0x50, 0xB9, 0xEC, 0xD2, 0xF6, 0x75,
]);

// PES 2020 Master Key (fallback)
export const MASTER_KEY_PES20 = new Uint8Array([
  0xE2, 0xBF, 0x51, 0x07, 0x54, 0xE6, 0x21, 0x78,
  0x2C, 0x5E, 0x8D, 0x33, 0x13, 0x7A, 0xC9, 0x15,
  0x99, 0x77, 0xD9, 0xA0, 0x1B, 0xC2, 0x95, 0xD9,
  0xBB, 0x9B, 0xB1, 0x00, 0x84, 0x1C, 0xB3, 0x62,
  0xE5, 0x40, 0xD9, 0x56, 0x45, 0x5B, 0x7C, 0x7C,
  0x4F, 0xF1, 0xDA, 0x26, 0xB4, 0x5A, 0x0C, 0x5C,
  0x4D, 0x6B, 0x9E, 0x98, 0x75, 0xA9, 0x39, 0x07,
  0x4C, 0x4B, 0x55, 0xBD, 0x8E, 0x01, 0xA9, 0x31,
]);

const ENCRYPTION_HEADER_SIZE = 320;
const FILE_HEADER_SIZE = 96; // sizeof(FileHeader)

let initialized = false;
let mt: MT19937;

/**
 * Initialize the crypto module
 */
export async function initCrypto(): Promise<boolean> {
  mt = new MT19937();
  initialized = true;
  console.log("[PES Crypto] Initialized (TypeScript implementation)");
  return true;
}

/**
 * Check if crypto module is ready
 */
export function isCryptoReady(): boolean {
  return initialized;
}

/**
 * Rotate left 32-bit
 */
function rol(a: number, shift: number): number {
  return ((a << shift) | (a >>> (32 - shift))) >>> 0;
}

/**
 * Rotate right 32-bit
 */
function ror(a: number, shift: number): number {
  return ((a >>> shift) | (a << (32 - shift))) >>> 0;
}

/**
 * XOR repeating blocks (64-byte block)
 */
function xorRepeatingBlocks(output: Uint8Array, input: Uint8Array, length: number): void {
  for (let i = 0; i < length; i++) {
    output[i & 63] ^= input[i];
  }
}

/**
 * XOR with 64-bit param across 64-byte block
 */
function xorWithLongParam(input: Uint8Array, output: Uint8Array, param: bigint): void {
  // Convert param to 8 bytes (little-endian)
  const paramBytes = new Uint8Array(8);
  let p = param;
  for (let i = 0; i < 8; i++) {
    paramBytes[i] = Number(p & 0xFFn);
    p >>= 8n;
  }
  
  // XOR each 8-byte block with the param
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      output[i * 8 + j] = input[i * 8 + j] ^ paramBytes[j];
    }
  }
}

/**
 * Reverse longs (reverse bytes within each 8-byte block)
 */
function reverseLongs(output: Uint8Array, input: Uint8Array): void {
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      output[i * 8 + j] = input[i * 8 + 7 - j];
    }
  }
}

/**
 * Read 32-bit little-endian from buffer
 */
function readUint32LE(data: Uint8Array, offset: number): number {
  return (data[offset] | (data[offset + 1] << 8) | (data[offset + 2] << 16) | (data[offset + 3] << 24)) >>> 0;
}

/**
 * Write 32-bit little-endian to buffer
 */
function writeUint32LE(data: Uint8Array, offset: number, value: number): void {
  data[offset] = value & 0xFF;
  data[offset + 1] = (value >>> 8) & 0xFF;
  data[offset + 2] = (value >>> 16) & 0xFF;
  data[offset + 3] = (value >>> 24) & 0xFF;
}

/**
 * Crypt stream using MT19937 and rolling XOR
 */
function cryptStream(output: Uint8Array, key: Uint8Array, input: Uint8Array, length: number): void {
  // Convert key to Uint32Array (16 x 32-bit values from 64 bytes)
  const keyArray = new Uint32Array(16);
  for (let i = 0; i < 16; i++) {
    keyArray[i] = readUint32LE(key, i * 4);
  }
  
  mt.initByArray(keyArray);
  
  let c0 = mt.genrandInt32();
  let c1 = mt.genrandInt32();
  let c2 = mt.genrandInt32();
  let c3 = mt.genrandInt32();
  
  const length4 = Math.floor(length / 4);
  
  for (let i = 0; i < length4; i++) {
    const c4 = mt.genrandInt32();
    const inputValue = readUint32LE(input, i * 4);
    const outputValue = (c4 ^ c3 ^ c2 ^ c1 ^ c0 ^ inputValue) >>> 0;
    writeUint32LE(output, i * 4, outputValue);
    
    c0 = ror(c1, 15);
    c1 = rol(c2, 11);
    c2 = rol(c3, 7);
    c3 = ror(c4, 13);
  }
  
  // Handle remaining bytes
  const remaining = length & 3;
  if (remaining > 0) {
    let rest = 0;
    const restOffset = length4 * 4;
    for (let i = 0; i < remaining; i++) {
      rest |= input[restOffset + i] << (i * 8);
    }
    
    rest = (rest ^ mt.genrandInt32() ^ c3 ^ c2 ^ c1 ^ c0) >>> 0;
    
    for (let i = 0; i < remaining; i++) {
      output[restOffset + i] = (rest >>> (i * 8)) & 0xFF;
    }
  }
}

/**
 * Decrypt the encryption header
 */
function cryptHeader(output: Uint8Array, input: Uint8Array, masterKey: Uint8Array): void {
  const headerKey = new Uint8Array(64);
  const shuffledMasterKey = new Uint8Array(64);
  
  // Copy bytes 256-319 of input to headerKey
  headerKey.set(input.slice(256, 320));
  
  // Reverse longs of master key
  reverseLongs(shuffledMasterKey, masterKey);
  
  // XOR with shuffled master key
  xorRepeatingBlocks(headerKey, shuffledMasterKey, 64);
  
  // Crypt the stream
  cryptStream(output, headerKey, input, ENCRYPTION_HEADER_SIZE);
  
  // Copy the original key portion back
  output.set(input.slice(256, 320), 256);
}

/**
 * File header structure (96 bytes)
 */
interface FileHeader {
  mysteryData: Uint8Array;  // 64 bytes
  descSize: number;         // 4 bytes
  logoSize: number;         // 4 bytes
  dataSize: number;         // 4 bytes
  serialLength: number;     // 4 bytes
  unknown: Uint8Array;      // 16 bytes
}

/**
 * Parse file header from decrypted bytes
 */
function parseFileHeader(data: Uint8Array): FileHeader {
  return {
    mysteryData: data.slice(0, 64),
    descSize: readUint32LE(data, 64),
    logoSize: readUint32LE(data, 68),
    dataSize: readUint32LE(data, 72),
    serialLength: readUint32LE(data, 76),
    unknown: data.slice(80, 96),
  };
}

/**
 * Result of decryption
 */
export interface DecryptedEditFile {
  encryptionHeader: Uint8Array;
  fileHeader: FileHeader;
  description: Uint8Array;
  logo: Uint8Array;
  data: Uint8Array;
  serial: Uint8Array;
}

/**
 * Decrypt a PES EDIT file with a specific master key
 */
export function decryptWithKey(input: Uint8Array, masterKey: Uint8Array): DecryptedEditFile | null {
  if (!initialized) {
    throw new Error("Crypto not initialized. Call initCrypto() first.");
  }
  
  if (input.length < ENCRYPTION_HEADER_SIZE + FILE_HEADER_SIZE) {
    console.error("[PES Crypto] File too small");
    return null;
  }
  
  console.log(`[PES Crypto] Decrypting ${input.length} bytes`);
  
  // Step 1: Decrypt encryption header
  const encryptionHeader = new Uint8Array(ENCRYPTION_HEADER_SIZE);
  cryptHeader(encryptionHeader, input, masterKey);
  
  let offset = ENCRYPTION_HEADER_SIZE;
  
  // Step 2: Build rolling key from encryption header
  const rollingKey = new Uint8Array(64);
  rollingKey.set(encryptionHeader.slice(0, 64));
  xorRepeatingBlocks(rollingKey, encryptionHeader.slice(64, 320), 256);
  
  // Step 3: Decrypt file header
  const intermediateKey = new Uint8Array(64);
  const fileHeaderRaw = new Uint8Array(FILE_HEADER_SIZE);
  
  xorWithLongParam(rollingKey, intermediateKey, BigInt(FILE_HEADER_SIZE));
  cryptStream(fileHeaderRaw, intermediateKey, input.slice(offset, offset + FILE_HEADER_SIZE), FILE_HEADER_SIZE);
  offset += FILE_HEADER_SIZE;
  
  const fileHeader = parseFileHeader(fileHeaderRaw);
  
  console.log(`[PES Crypto] File header: desc=${fileHeader.descSize}, logo=${fileHeader.logoSize}, data=${fileHeader.dataSize}, serial=${fileHeader.serialLength}`);
  
  // Validate sizes
  const expectedSize = ENCRYPTION_HEADER_SIZE + FILE_HEADER_SIZE + 
                       fileHeader.descSize + fileHeader.logoSize + 
                       fileHeader.dataSize + fileHeader.serialLength * 2;
  
  if (expectedSize > input.length * 2 || fileHeader.dataSize > input.length) {
    console.error(`[PES Crypto] Invalid file header sizes (expected ~${expectedSize}, have ${input.length})`);
    return null;
  }
  
  // Step 4: Decrypt description
  const description = new Uint8Array(fileHeader.descSize);
  xorWithLongParam(rollingKey, intermediateKey, 0n);
  cryptStream(description, intermediateKey, input.slice(offset, offset + fileHeader.descSize), fileHeader.descSize);
  offset += fileHeader.descSize;
  
  // Step 5: Decrypt logo
  const logo = new Uint8Array(fileHeader.logoSize);
  xorWithLongParam(rollingKey, intermediateKey, 1n);
  cryptStream(logo, intermediateKey, input.slice(offset, offset + fileHeader.logoSize), fileHeader.logoSize);
  offset += fileHeader.logoSize;
  
  // Step 6: Decrypt data (this is the actual EDIT data we want)
  const data = new Uint8Array(fileHeader.dataSize);
  xorWithLongParam(rollingKey, intermediateKey, 2n);
  cryptStream(data, intermediateKey, input.slice(offset, offset + fileHeader.dataSize), fileHeader.dataSize);
  offset += fileHeader.dataSize;
  
  // Step 7: Decrypt serial
  const serialSize = fileHeader.serialLength * 2;
  const serial = new Uint8Array(serialSize);
  xorWithLongParam(rollingKey, intermediateKey, 3n);
  cryptStream(serial, intermediateKey, input.slice(offset, offset + serialSize), serialSize);
  
  console.log(`[PES Crypto] Decryption complete. Data size: ${data.length} bytes`);
  
  return {
    encryptionHeader,
    fileHeader,
    description,
    logo,
    data,
    serial,
  };
}

/**
 * Try to decrypt a PES EDIT file, auto-detecting the correct master key
 */
export function decryptBuffer(input: Uint8Array, _key: number = 0xAA): Uint8Array {
  if (!initialized) {
    throw new Error("Crypto not initialized. Call initCrypto() first.");
  }
  
  // Try PES 2021 key first
  console.log("[PES Crypto] Trying PES 2021 master key...");
  let result = decryptWithKey(input, MASTER_KEY_PES21);
  
  if (result && result.data.length > 0) {
    console.log("[PES Crypto] Successfully decrypted with PES 2021 key");
    return result.data;
  }
  
  // Try PES 2020 key as fallback
  console.log("[PES Crypto] Trying PES 2020 master key...");
  result = decryptWithKey(input, MASTER_KEY_PES20);
  
  if (result && result.data.length > 0) {
    console.log("[PES Crypto] Successfully decrypted with PES 2020 key");
    return result.data;
  }
  
  console.error("[PES Crypto] All decryption attempts failed");
  return input;
}

/**
 * Get the full decrypted file structure
 */
export function decryptEditFile(input: Uint8Array): DecryptedEditFile | null {
  if (!initialized) {
    throw new Error("Crypto not initialized. Call initCrypto() first.");
  }
  
  // Try PES 2021 key first
  let result = decryptWithKey(input, MASTER_KEY_PES21);
  if (result && result.data.length > 0) {
    return result;
  }
  
  // Try PES 2020 key
  result = decryptWithKey(input, MASTER_KEY_PES20);
  if (result && result.data.length > 0) {
    return result;
  }
  
  return null;
}

/**
 * Encrypt data back to PES EDIT format
 */
export function encryptBuffer(data: Uint8Array, _key: number = 0xAA): Uint8Array {
  if (!initialized) {
    throw new Error("Crypto not initialized. Call initCrypto() first.");
  }
  
  // TODO: Implement encryption for saving modified EDIT files
  console.log(`[PES Crypto] Encrypting ${data.length} bytes (not yet implemented)`);
  return data;
}

/**
 * XOR decrypt/encrypt (simple symmetric operation - legacy)
 */
export function xorCrypt(data: Uint8Array, key: number): Uint8Array {
  const result = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    result[i] = data[i] ^ key;
  }
  return result;
}
