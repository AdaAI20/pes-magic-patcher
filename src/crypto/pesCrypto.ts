/* eslint-disable */

/**
 * PES Crypto Wrapper (GitHub Pages SAFE)
 */

import "../wasm/pes_crypto.js";

declare global {
  interface Window {
    Module: any;
  }
}

let cryptoReady = false;

/* -------------------------------------------------- */
/* 🔥 RESOLVE WASM PATH (Vite + GitHub Pages) */
/* -------------------------------------------------- */
function resolveWasmPath() {
  const base = import.meta.env.BASE_URL || "/";
  return `${base.replace(/\/$/, "")}/pes_crypto.wasm`;
}

export async function initCrypto() {
  if (cryptoReady) return;

  if (typeof window === "undefined") {
    throw new Error("Crypto can only run in browser");
  }

  window.Module = window.Module || {};
  window.Module.locateFile = () => {
    const path = resolveWasmPath();
    console.log("[CRYPTO] WASM path resolved:", path);
    return path;
  };

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("WASM load timeout"));
    }, 8000);

    window.Module.onRuntimeInitialized = () => {
      clearTimeout(timeout);
      cryptoReady = true;
      console.log("[CRYPTO] Runtime initialized");
      resolve();
    };
  });
}

/* -------------------------------------------------- */
/* CRYPTO FUNCTIONS */
/* -------------------------------------------------- */

export function decryptEditBin(buffer: ArrayBuffer): ArrayBuffer {
  if (!cryptoReady) {
    throw new Error("Crypto not initialized");
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

export function encryptEditBin(buffer: ArrayBuffer): ArrayBuffer {
  if (!cryptoReady) {
    throw new Error("Crypto not initialized");
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
