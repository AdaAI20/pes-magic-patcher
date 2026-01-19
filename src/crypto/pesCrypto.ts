// Pure JS. No imports. No WASM.
let cryptoReady = false;

export async function initCrypto() {
  console.log("[CRYPTO] Init called.");
  cryptoReady = true;
  return Promise.resolve();
}

export function decryptEditBin(buffer: ArrayBuffer): ArrayBuffer {
  console.log("[CRYPTO] Decrypt called.");
  return buffer.slice(0);
}

export function encryptEditBin(buffer: ArrayBuffer): ArrayBuffer {
  return buffer.slice(0);
}
