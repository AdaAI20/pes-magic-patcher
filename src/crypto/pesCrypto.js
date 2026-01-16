/* eslint-disable */

/*
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
/* 2. FORCE WASM PATH (GITHUB PAGES SAFE) */
/* ------------------------------------------------------------------ */

if (typeof window !== "undefined") {
  window.Module = window.Module || {};

  // Always resolve the WASM relative to the GH Pages path
  window.Module.locateFile = (path) => {
    console.log("Looking for WASM file at:", path);
    return `/pes-magic-patcher/${path}`;
  };
}

let cryptoReady = false;

/* ------------------------------------------------------------------ */
/* INIT FUNCTION (USED BY React) */
/* ------------------------------------------------------------------ */

export async function initCrypto() {
  if (cryptoReady) return;

  if (!window.Module) {
    throw new Error("PES crypto module not loaded");
  }

  await new Promise((resolve, reject) => {
    window.Module.onRuntimeInitialized = () => {
      cryptoReady = true;
      console.log("Crypto runtime initialized");
      resolve();
    };
  });
}

/* ------------------------------------------------------------------ */
/* CRYPTO HELPERS */
/* ------------------------------------------------------------------ */

export function decryptEditBin(buffer) {
  if (!cryptoReady) {
    throw new Error("Crypto not initialized. Call initCrypto() first.");
  }

  const input = new Uint8Array(buffer);
  const output = new Uint8Array(input.length);

  window.Module._decrypt(input.byteOffset, output.byteOffset, input.length);

  return output.buffer;
}

export function encryptEditBin(buffer) {
  if (!cryptoReady) {
    throw new Error("Crypto not initialized. Call initCrypto() first.");
  }

  const input = new Uint8Array(buffer);
  const output = new Uint8Array(input.length);

  window.Module._encrypt(input.byteOffset, output.byteOffset, input.length);

  return output.buffer;
}
