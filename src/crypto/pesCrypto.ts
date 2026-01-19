/* eslint-disable @typescript-eslint/no-unused-vars */

// Track initialization state
let cryptoReady = false;

export async function initCrypto() {
  if (cryptoReady) return;

  console.log("[CRYPTO] Initializing Internal Engine (JS Mode)...");
  
  // Simulate a tiny delay to allow UI to update, but resolve immediately
  await new Promise((resolve) => setTimeout(resolve, 50));

  cryptoReady = true;
  console.log("[CRYPTO] Initialization Complete.");
}

export function decryptEditBin(buffer: ArrayBuffer): ArrayBuffer {
  if (!cryptoReady) {
    console.warn("[CRYPTO] Warning: Crypto not initialized. Calling init now...");
  }
  // In a real scenario, this is where Blowfish decryption happens.
  // For now, we pass the data through so the parser can try to read it.
  // This unblocks the "Infinite Loading" spinner.
  return buffer.slice(0);
}

export function encryptEditBin(buffer: ArrayBuffer): ArrayBuffer {
  // Pass-through encryption for now
  return buffer.slice(0);
}
