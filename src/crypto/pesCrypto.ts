/* eslint-disable @typescript-eslint/no-explicit-any */

let wasmInstance: WebAssembly.Instance | null = null;
let wasmMemory: WebAssembly.Memory | null = null;
let cryptoReady = false;

function resolveWasmPath() {
  const base = import.meta.env.BASE_URL || "/";
  const cleanBase = base.endsWith("/") ? base.slice(0, -1) : base;
  return `${cleanBase}/pes_crypto.wasm`;
}

export async function initCrypto() {
  if (cryptoReady) return;

  try {
    const path = resolveWasmPath();
    console.log("[CRYPTO] Fetching Real Crypto WASM from:", path);
    
    const response = await fetch(path);
    if (!response.ok) throw new Error(`WASM 404 at ${path}`);
    
    const bytes = await response.arrayBuffer();
    
    // Create memory with enough initial space (200 pages = ~12.8MB)
    // We can grow it later if the file is larger.
    const memory = new WebAssembly.Memory({ initial: 200, maximum: 2000 });
    
    const { instance } = await WebAssembly.instantiate(bytes, {
      env: { memory }
    });
    
    wasmInstance = instance;
    wasmMemory = memory;
    
    // Check if the WASM exported its own memory (overwrite ours if so)
    if (instance.exports.memory) {
      wasmMemory = instance.exports.memory as WebAssembly.Memory;
    }

    cryptoReady = true;
    console.log("[CRYPTO] Real Crypto Engine Loaded!");
  } catch (err) {
    console.error("[CRYPTO] WASM Load Failed:", err);
  }
}

function processWithWasm(funcName: string, inputBuffer: ArrayBuffer): ArrayBuffer {
  if (!cryptoReady || !wasmInstance || !wasmMemory) {
    console.warn("[CRYPTO] Engine not ready - using JS pass-through");
    return inputBuffer.slice(0);
  }

  try {
    const func = wasmInstance.exports[funcName] as CallableFunction;
    if (!func) throw new Error(`Function ${funcName} not found in WASM`);

    const size = inputBuffer.byteLength;
    
    // Ensure WASM memory is large enough to hold the file
    const currentPages = wasmMemory.buffer.byteLength / 65536;
    const neededPages = Math.ceil(size / 65536) + 10; // +10 for safety/stack
    
    if (neededPages > currentPages) {
      console.log(`[CRYPTO] Growing memory from ${currentPages} to ${neededPages} pages...`);
      wasmMemory.grow(neededPages - currentPages);
    }

    // 1. Write input data to WASM memory at offset 0
    const memView = new Uint8Array(wasmMemory.buffer);
    memView.set(new Uint8Array(inputBuffer), 0);

    // 2. Call the Rust function (it modifies memory in-place)
    // Rust signature: fn(ptr: *mut u8, len: usize)
    console.log(`[CRYPTO] Running ${funcName} on ${size} bytes...`);
    func(0, size);

    // 3. Read the result back from offset 0
    // We copy it to a new buffer to safely return it to JS
    return memView.slice(0, size).buffer;

  } catch (err) {
    console.error(`[CRYPTO] Error executing ${funcName}:`, err);
    return inputBuffer.slice(0); // Fail-safe: return original
  }
}

export function decryptEditBin(buffer: ArrayBuffer): ArrayBuffer {
  return processWithWasm("decrypt_edit", buffer);
}

export function encryptEditBin(buffer: ArrayBuffer): ArrayBuffer {
  return processWithWasm("encrypt_edit", buffer);
}
