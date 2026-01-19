/* eslint-disable @typescript-eslint/no-unused-vars */

let cryptoReady = false;

export async function initCrypto() {
  if (cryptoReady) return;
  
  console.log("[CRYPTO] Initializing internal crypto engine (JS Mode)...");
  
  // Simulate a short delay to ensure UI updates, but DO NOT load external files
  await new Promise(resolve => setTimeout(resolve, 100));
  
  cryptoReady = true;
  console.log("[CRYPTO] Crypto initialized successfully");
}

export function decryptEditBin(buffer: ArrayBuffer): ArrayBuffer {
  if (!cryptoReady) {
    console.warn("[CRYPTO] Crypto not initialized, call initCrypto() first.");
    return buffer;
  }

  // Pass-through for now (unblocks UI)
  console.log(`[CRYPTO] Decrypting ${buffer.byteLength} bytes (Passthrough)`);
  return buffer.slice(0); 
}

export function encryptEditBin(buffer: ArrayBuffer): ArrayBuffer {
  console.log(`[CRYPTO] Encrypting ${buffer.byteLength} bytes (Passthrough)`);
  return buffer.slice(0);
}
