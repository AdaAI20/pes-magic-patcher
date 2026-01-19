/* eslint-disable @typescript-eslint/no-unused-vars */

// Pure JS. No imports. No WASM.
let cryptoReady = false;

export async function initCrypto() {
  console.log("🔥 NUCLEAR FIX: initCrypto CALLED 🔥"); // Look for this in console!
  cryptoReady = true;
  return Promise.resolve();
}

export function decryptEditBin(buffer: ArrayBuffer): ArrayBuffer {
  console.log("🔥 NUCLEAR FIX: decryptEditBin CALLED 🔥");
  return buffer.slice(0);
}

export function encryptEditBin(buffer: ArrayBuffer): ArrayBuffer {
  return buffer.slice(0);
}
