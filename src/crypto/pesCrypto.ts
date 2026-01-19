/* eslint-disable @typescript-eslint/no-unused-vars */

// 1. Force state to start as "not ready"
let cryptoReady = false;

// 2. This function MUST resolve immediately to stop the loading spinner
export async function initCrypto() {
  if (cryptoReady) return;

  console.log("[CRYPTO] Initializing (Bypass Mode)...");
  
  // No WASM fetching. No waiting. Just success.
  cryptoReady = true; 
  return Promise.resolve();
}

// 3. Simple pass-through (No decryption yet, just lets the file load)
export function decryptEditBin(buffer: ArrayBuffer): ArrayBuffer {
  if (!cryptoReady) console.warn("[CRYPTO] Warning: initCrypto not called yet");
  console.log(`[CRYPTO] Bypassing decryption for ${buffer.byteLength} bytes`);
  return buffer.slice(0);
}

export function encryptEditBin(buffer: ArrayBuffer): ArrayBuffer {
  console.log(`[CRYPTO] Bypassing encryption for ${buffer.byteLength} bytes`);
  return buffer.slice(0);
}
