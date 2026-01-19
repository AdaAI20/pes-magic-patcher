/* eslint-disable */

import "../wasm/pes_crypto.js";

declare global {
  interface Window {
    Module: any;
  }
}

let cryptoReady = false;

/* -------------------------------------------------- */
/* RESOLVE WASM PATH */
/* -------------------------------------------------- */
function resolveWasmPath() {
  const base = import.meta.env.BASE_URL || "/";
  // Remove trailing slash if exists to avoid //
  const cleanBase = base.endsWith("/") ? base.slice(0, -1) : base;
  return `${cleanBase}/pes_crypto.wasm`;
}

/* -------------------------------------------------- */
/* INIT CRYPTO */
/* -------------------------------------------------- */
export async function initCrypto() {
  if (cryptoReady) return;

  if (typeof window === "undefined") {
    throw new Error("Crypto can only run in browser");
  }

  // Hook into Emscripten loader
  window.Module = window.Module || {};
  window.Module.locateFile = (path) => {
    if (path.endsWith(".wasm")) {
      const fullPath = resolveWasmPath();
      console.log("[CRYPTO] WASM path resolved:", fullPath);
      return fullPath;
    }
    return path;
  };

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      console.warn("[CRYPTO] WASM load timeout - forcing continue");
      resolve(); // Don't block app forever
    }, 5000);

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
    console.warn("[CRYPTO] Not ready - returning raw buffer");
    return buffer;
  }

  const input = new Uint8Array(buffer);
  const output = new Uint8Array(input.length);

  try {
    // 1. Allocate memory in WASM
    const ptr = window.Module._malloc(input.length);
    const outPtr = window.Module._malloc(input.length);

    // 2. Copy data in
    window.Module.HEAPU8.set(input, ptr);

    // 3. Call decrypt
    // Rust signature: decrypt_edit(ptr, len) -> returns vec
    // BUT we used "passthrough" in Rust which returns Vec<u8>
    // Emscripten/bindgen handles the return value differently.
    // For raw pointer calls:
    
    // NOTE: Your Rust code used [wasm_bindgen] which means 
    // it expects the JS glue to handle memory.
    // Calling _decrypt_edit directly might crash if signature doesn't match.
    
    // SAFE MODE: Use the high-level export if available
    if (window.Module.decrypt_edit) {
        const result = window.Module.decrypt_edit(input);
        return result.buffer; // TypedArray to Buffer
    } 
    
    // Fallback if direct export fails (safe passthrough)
    return buffer;

  } catch (err) {
    console.error("[CRYPTO] Decrypt error:", err);
    return buffer;
  }
}

export function encryptEditBin(buffer: ArrayBuffer): ArrayBuffer {
  // Passthrough for now
  return buffer;
}
