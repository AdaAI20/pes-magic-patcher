/* eslint-disable @typescript-eslint/no-explicit-any */

let wasmInstance: WebAssembly.Instance | null = null;
let cryptoReady = false;

// Helper to handle GitHub Pages paths
function resolveWasmPath() {
  const base = import.meta.env.BASE_URL || "/";
  const cleanBase = base.endsWith("/") ? base.slice(0, -1) : base;
  return `${cleanBase}/pes_crypto.wasm`;
}

export async function initCrypto() {
  if (cryptoReady) return;

  try {
    const path = resolveWasmPath();
    console.log("[CRYPTO] Fetching Standalone WASM from:", path);
    
    const response = await fetch(path);
    if (!response.ok) {
        throw new Error(`WASM 404 at ${path} - Status: ${response.status}`);
    }
    
    const bytes = await response.arrayBuffer();
    
    // Load the WASM directly (No Emscripten Glue needed for Standalone)
    const { instance } = await WebAssembly.instantiate(bytes, {});
    
    wasmInstance = instance;
    cryptoReady = true;
    console.log("[CRYPTO] WASM Engine Loaded Successfully!");
  } catch (err) {
    console.error("[CRYPTO] WASM Load Failed:", err);
    // Don't throw, just log. App will fallback to pass-through.
  }
}

export function decryptEditBin(buffer: ArrayBuffer): ArrayBuffer {
  // 1. Check if WASM is ready
  if (!cryptoReady || !wasmInstance) {
    console.warn("[CRYPTO] Engine not ready - using JS pass-through");
    return buffer.slice(0); // Return copy
  }

  // 2. PASS-THROUGH (Until we add Real Logic)
  // Currently, your WASM is a "Skeleton" (Empty).
  // Calling it won't decrypt anything yet.
  // We return the buffer as-is so the UI shows the "Encrypted/Garbage" data safely.
  return buffer.slice(0);
}

export function encryptEditBin(buffer: ArrayBuffer): ArrayBuffer {
  return buffer.slice(0);
}
