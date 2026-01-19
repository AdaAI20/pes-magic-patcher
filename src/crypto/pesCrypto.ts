/* eslint-disable @typescript-eslint/no-explicit-any */

let wasmInstance: WebAssembly.Instance | null = null;
let cryptoReady = false;
let memory: WebAssembly.Memory | null = null;

function getWasmPath() {
  const base = import.meta.env.BASE_URL.endsWith('/') 
    ? import.meta.env.BASE_URL 
    : `${import.meta.env.BASE_URL}/`;
  return `${base}pes_crypto.wasm`;
}

export async function initCrypto() {
  if (cryptoReady) return;

  try {
    console.log("[CRYPTO] Fetching Standalone WASM...");
    const response = await fetch(getWasmPath());
    if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);

    const buffer = await response.arrayBuffer();
    
    // Create memory (100 pages = 6.4MB, growable) to share with WASM
    const wasmMemory = new WebAssembly.Memory({ initial: 100, maximum: 1000 });
    
    const importObject = {
      env: {
        memory: wasmMemory,
      }
    };

    const module = await WebAssembly.instantiate(buffer, importObject);
    wasmInstance = module.instance;
    
    // Use the exported memory if available, otherwise use what we created
    if (wasmInstance.exports.memory) {
      memory = wasmInstance.exports.memory as WebAssembly.Memory;
    } else {
      memory = wasmMemory;
    }

    cryptoReady = true;
    console.log("[CRYPTO] WASM Initialized Successfully (463B Skeleton)!");
  } catch (e) {
    console.error("[CRYPTO] WASM Load Error:", e);
    cryptoReady = false;
  }
}

// Wrapper to call WASM functions
function processWithWasm(funcName: string, inputBuffer: ArrayBuffer): ArrayBuffer {
  if (!cryptoReady || !wasmInstance || !memory) {
    console.warn("[CRYPTO] System not ready, passing through.");
    return inputBuffer.slice(0);
  }

  try {
    const exports = wasmInstance.exports as any;
    const func = exports[funcName] as CallableFunction;

    if (!func) {
      console.warn(`[CRYPTO] Function ${funcName} missing.`);
      return inputBuffer.slice(0);
    }

    const len = inputBuffer.byteLength;
    
    // For this simple standalone WASM, we write to the start of memory (Offset 0)
    const ptr = 0; 
    
    // Ensure memory is large enough
    if (memory.buffer.byteLength < len) {
        memory.grow(Math.ceil((len - memory.buffer.byteLength) / 65536));
    }

    const memArray = new Uint8Array(memory.buffer);
    memArray.set(new Uint8Array(inputBuffer), ptr);

    // Call Rust (it modifies memory in place)
    func(ptr, len);

    // Read result back
    return memArray.slice(ptr, ptr + len).buffer;

  } catch (e) {
    console.error(`[CRYPTO] Execution Error (${funcName}):`, e);
    return inputBuffer.slice(0);
  }
}

export function decryptEditBin(buffer: ArrayBuffer): ArrayBuffer {
  console.log(`[CRYPTO] Decrypting ${buffer.byteLength} bytes via WASM...`);
  return processWithWasm("decrypt_edit", buffer);
}

export function encryptEditBin(buffer: ArrayBuffer): ArrayBuffer {
  return processWithWasm("encrypt_edit", buffer);
}
