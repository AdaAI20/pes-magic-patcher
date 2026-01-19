/* eslint-disable @typescript-eslint/no-unused-vars */

// Pure JS implementation to ensure stability
let cryptoReady = false;

export async function initCrypto() {
  if (cryptoReady) return;
  
  // Simulate async initialization if needed, or just set ready
  console.log("[CRYPTO] Initializing internal crypto engine (JS Mode)...");
  await new Promise(resolve => setTimeout(resolve, 100)); // Tiny delay to ensure UI updates
  
  cryptoReady = true;
  console.log("[CRYPTO] Crypto initialized successfully");
}

export function decryptEditBin(buffer: ArrayBuffer): ArrayBuffer {
  if (!cryptoReady) {
    console.warn("[CRYPTO] Crypto not initialized, call initCrypto() first.");
    return buffer;
  }

  // TODO: Implement actual PES 2021 decryption (Blowfish/LZMA) here.
  // For now, we pass the buffer through to allow the parser to attempt reading.
  // If the file is unencrypted (e.g. PC Option File decrypted), this works.
  // If encrypted, the parser will catch the garbage data.
  console.log(`[CRYPTO] Decrypting ${buffer.byteLength} bytes (Passthrough)`);
  return buffer.slice(0); // Return a copy
}

export function encryptEditBin(buffer: ArrayBuffer): ArrayBuffer {
  console.log(`[CRYPTO] Encrypting ${buffer.byteLength} bytes (Passthrough)`);
  return buffer.slice(0);
}
