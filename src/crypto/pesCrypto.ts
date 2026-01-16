/* =========================================================
   PES CRYPTO — TEMP DEBUG / NO-OP VERSION (GitHub Pages)
   ========================================================= */

console.log("[CRYPTO] pesCrypto module loaded");

/**
 * TEMP: Skip real crypto for now
 * Reason:
 * - WASM fails silently on GitHub Pages
 * - We must unblock EDIT loading first
 */

let initialized = false;

export async function initCrypto(): Promise<void> {
  console.warn("[CRYPTO] initCrypto() SKIPPED (debug mode)");
  initialized = true;
}

/**
 * TEMP: Return raw buffer untouched
 */
export function decryptEditBin(buffer: ArrayBuffer): ArrayBuffer {
  if (!initialized) {
    console.warn("[CRYPTO] decryptEditBin called before initCrypto");
  }

  console.log("[CRYPTO] decryptEditBin passthrough");
  return buffer;
}

/**
 * TEMP: Return raw buffer untouched
 */
export function encryptEditBin(buffer: ArrayBuffer): ArrayBuffer {
  console.log("[CRYPTO] encryptEditBin passthrough");
  return buffer;
}
