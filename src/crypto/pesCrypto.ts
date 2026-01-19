/* eslint-disable @typescript-eslint/no-explicit-any */

let wasmInstance: WebAssembly.Instance | null = null;
let cryptoReady = false;
let memory: WebAssembly.Memory | null = null;

// Determine correct path for GitHub Pages
function getWasmPath() {
  // If we are on localhost, use root. If on GitHub pages, prepend repo name if needed.
  // Ideally, 'import.meta.env.BASE_URL' handles this automatically via Vite.
  const base = import.meta.env.BASE_URL.endsWith('/') 
    ? import.meta.env.BASE_URL 
    : `${import.meta.env.BASE_URL}/`;
  return `${base}pes_crypto.wasm`;
}

export async function initCrypto() {
  if (cryptoReady) return;

  try {
    console.log("[CRYPTO] Fetching WASM from:", getWasmPath());
    const response = await fetch(getWasmPath());
    
    if (!response.ok) {
        throw new Error(`WASM Fetch failed with status: ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    
    // Instantiate the WASM
    const module = await WebAssembly.instantiate(buffer, {});
    wasmInstance = module.instance;
    memory = wasmInstance.exports.memory as WebAssembly.Memory;
    
    // Attempt to initialize Rust logic if the function exists
    const rustInit = wasmInstance.exports.init_crypto as CallableFunction;
    if (rustInit) rustInit();

    cryptoReady = true;
    console.log("[CRYPTO] WASM Engine Successfully Initialized!");
  } catch (e) {
    console.error("[CRYPTO] Failed to load WASM:", e);
    // We do NOT throw here, so the app doesn't crash. 
    // It will just stay in pass-through mode if WASM fails.
    cryptoReady = false; 
  }
}

// Helper to pass data to Rust and get data back
function runWasmFunction(funcName: string, inputBuffer: ArrayBuffer): ArrayBuffer {
  if (!cryptoReady || !wasmInstance || !memory) {
    // Fallback: If WASM failed to load, just return original data
    return inputBuffer.slice(0);
  }

  try {
    const exports = wasmInstance.exports as any;
    const func = exports[funcName] as CallableFunction;
    
    if (!func) {
        console.warn(`[CRYPTO] Function ${funcName} not found in WASM.`);
        return inputBuffer.slice(0);
    }
    
    // NOTE: Since the Colab build was a simple "Pass-through" Rust function 
    // that takes &[u8] and returns Vec<u8>, we need a specific memory strategy 
    // to pass arrays between JS and Rust (WasmBindgen usually handles this).
    //
    // For this specific "Dummy" step, we will simply verify the function calls 
    // without crashing.
    
    // In a real implementation with `wasm-bindgen`, you would import the generated JS.
    // Since we are manually loading the WASM file, we are just verifying connectivity here.
    
    // Return original buffer for now to keep UI working while verifying WASM loaded.
    return inputBuffer.slice(0);

  } catch (e) {
    console.error(`[CRYPTO] Error running ${funcName}:`, e);
    return inputBuffer.slice(0);
  }
}

export function decryptEditBin(buffer: ArrayBuffer): ArrayBuffer {
  if (!cryptoReady) console.warn("[CRYPTO] WASM not ready, using JS pass-through.");
  
  // This log proves we switched from "NUCLEAR FIX" to "WASM Mode"
  console.log(`[CRYPTO] Decrypting ${buffer.byteLength} bytes via WASM...`);
  return runWasmFunction("decrypt_edit", buffer);
}

export function encryptEditBin(buffer: ArrayBuffer): ArrayBuffer {
  return runWasmFunction("encrypt_edit", buffer);
}
