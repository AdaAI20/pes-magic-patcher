/* eslint-disable */

/**
 * PES Crypto Wrapper
 * - Works with Vite
 * - Works in production
 * - Exports initCrypto, decryptEditBin, encryptEditBin
 */

/* ------------------------------------------------------------------ */
/* 1. LOAD EMCC RUNTIME (SIDE EFFECT ONLY) */
/* ------------------------------------------------------------------ */

import "../wasm/pes_crypto.js";

/* ------------------------------------------------------------------ */
/* 2. FORCE WASM PATH (VITE + GH PAGES SAFE) */
/* ------------------------------------------------------------------ */

if (typeof window !== "undefined") {
  window.Module = window.Module || {};
  window.Module.locateFile = () => "/pes_crypto.wasm";
}

/* ------------------------------------------------------------------ */
/* 3. INTERNAL STATE */
/* ------------------------------------------------------------------ */

let cryptoReady = false;

/* ------------------------------------------------------------------ */
/* 4. INIT FUNCTION (USED BY React) */
/* ------------------------------------------------------------------ */

export async function initCrypto() {
  if (cryptoReady) return;

  if (!window.Module) {
    throw new Error("PES crypto module not loaded");
  }

  await new Promise((resolve) => {
    window.Module.onRuntimeInitialized = () => {
      cryptoReady = true;
      resolve();
    };
  });
}

/* ------------------------------------------------------------------ */
/* 5. CRYPTO HELPERS */
/* ------------------------------------------------------------------ */

export function decryptEditBin(buffer) {
  if (!cryptoReady) {
    throw new Error("Crypto not initialized. Call initCrypto() first.");
  }

  const input = new Uint8Array(buffer);
  const output = new Uint8Array(input.length);

  window.Module._decrypt(
    input.byteOffset,
    output.byteOffset,
    input.length
  );

  return output.buffer;
}

export function encryptEditBin(buffer) {
  if (!cryptoReady) {
    throw new Error("Crypto not initialized. Call initCrypto() first.");
  }

  const input = new Uint8Array(buffer);
  const output = new Uint8Array(input.length);

  window.Module._encrypt(
    input.byteOffset,
    output.byteOffset,
    input.length
  );

  return output.buffer;
}
