/**
 * PES Crypto Module - Pure TypeScript Implementation
 * 
 * This is a passthrough implementation for testing the UI.
 * Real PES decryption logic can be added later when WASM is properly built.
 * 
 * The actual PES 2021 encryption uses XOR + Blowfish-like blocks,
 * but for now we pass through the data unchanged to unblock the UI.
 */

let initialized = false;

/**
 * Initialize the crypto module
 * In the future, this will load the WASM module
 */
export async function initCrypto(): Promise<boolean> {
  // For now, we don't need WASM - using pure JS passthrough
  initialized = true;
  console.log("[PES Crypto] Initialized (passthrough mode)");
  return true;
}

/**
 * Check if crypto module is ready
 */
export function isCryptoReady(): boolean {
  return initialized;
}

/**
 * Decrypt a buffer
 * @param data - The encrypted data
 * @param key - The decryption key (default: 0xAA for EDIT files)
 * @returns Decrypted data (currently passthrough)
 */
export function decryptBuffer(data: Uint8Array, key: number = 0xAA): Uint8Array {
  if (!initialized) {
    throw new Error("Crypto not initialized. Call initCrypto() first.");
  }
  
  // TODO: Implement real PES decryption
  // For now, return the data as-is for UI testing
  // Real implementation would do XOR + Blowfish decryption
  console.log(`[PES Crypto] Decrypting ${data.length} bytes (passthrough mode)`);
  return data;
}

/**
 * Encrypt a buffer
 * @param data - The plaintext data
 * @param key - The encryption key (default: 0xAA for EDIT files)
 * @returns Encrypted data (currently passthrough)
 */
export function encryptBuffer(data: Uint8Array, key: number = 0xAA): Uint8Array {
  if (!initialized) {
    throw new Error("Crypto not initialized. Call initCrypto() first.");
  }
  
  // TODO: Implement real PES encryption
  console.log(`[PES Crypto] Encrypting ${data.length} bytes (passthrough mode)`);
  return data;
}

/**
 * XOR decrypt/encrypt (simple symmetric operation)
 * This is one component of the PES encryption
 */
export function xorCrypt(data: Uint8Array, key: number): Uint8Array {
  const result = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    result[i] = data[i] ^ key;
  }
  return result;
}
