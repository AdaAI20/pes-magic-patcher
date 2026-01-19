/* eslint-disable @typescript-eslint/no-explicit-any */

let wasmInstance: WebAssembly.Instance | null = null;
let wasmMemory: WebAssembly.Memory | null = null;
let cryptoReady = false;

// PES 2021 Expected Magic Number (Little Endian)
// Hex: E9 90 F6 2D -> Decimal: 3918624301
const EXPECTED_MAGIC = 3918624301;

function resolveWasmPath() {
  const base = import.meta.env.BASE_URL || "/";
  const cleanBase = base.endsWith("/") ? base.slice(0, -1) : base;
  return `${cleanBase}/pes_crypto.wasm`;
}

export async function initCrypto() {
  if (cryptoReady) return;

  try {
    const path = resolveWasmPath();
    console.log("🔍 [AUTO-RETRY] Fetching WASM from:", path);
    
    const response = await fetch(path);
    if (!response.ok) throw new Error(`WASM 404 at ${path}`);
    
    const bytes = await response.arrayBuffer();

    // Create memory (200 pages = 12.8MB)
    const memory = new WebAssembly.Memory({ initial: 200, maximum: 2000 });
    const { instance } = await WebAssembly.instantiate(bytes, { env: { memory } });
    
    wasmInstance = instance;
    
    // Handle memory export
    if (instance.exports.memory) {
      wasmMemory = instance.exports.memory as WebAssembly.Memory;
    } else {
      wasmMemory = memory;
    }

    cryptoReady = true;
    
    // Debug: List available exports to confirm we see decrypt_v1 / decrypt_v2
    console.log("✅ [AUTO-RETRY] WASM Loaded. Exports:", Object.keys(instance.exports));

  } catch (err) {
    console.error("🚨 [AUTO-RETRY] Init Failed:", err);
  }
}

export function decryptEditBin(buffer: ArrayBuffer): ArrayBuffer {
  if (!cryptoReady || !wasmInstance || !wasmMemory) {
    console.warn("[CRYPTO] Not ready - passing through");
    return buffer.slice(0);
  }

  // 1. Identify available strategies from WASM exports
  const exports = wasmInstance.exports;
  const strategies: string[] = [];
  
  if (exports.decrypt_v1) strategies.push("decrypt_v1");
  if (exports.decrypt_v2) strategies.push("decrypt_v2");
  if (exports.decrypt_edit) strategies.push("decrypt_edit"); // Fallback for old WASM

  if (strategies.length === 0) {
    console.error("🚨 [AUTO-RETRY] No decrypt function found in WASM!");
    return buffer.slice(0);
  }

  // 2. Try each strategy
  for (const strategy of strategies) {
    console.log(`🔄 [AUTO-RETRY] Attempting Strategy: ${strategy}...`);

    try {
        const func = exports[strategy] as CallableFunction;
        
        // Prepare Memory
        const size = buffer.byteLength;
        const heapBase = (exports.__heap_base as WebAssembly.Global)?.value || 1048576;
        const filePointer = heapBase + 5242880; // 5MB safety gap
        
        // Grow if needed
        const requiredEnd = filePointer + size;
        if (wasmMemory.buffer.byteLength < requiredEnd) {
             const missing = requiredEnd - wasmMemory.buffer.byteLength;
             const pages = Math.ceil(missing / 65536) + 10;
             wasmMemory.grow(pages);
        }

        // Write Data
        new Uint8Array(wasmMemory.buffer).set(new Uint8Array(buffer), filePointer);

        // Execute
        func(filePointer, size);

        // Read Result
        // Important: Get fresh buffer view after execution
        const resultBuffer = wasmMemory.buffer.slice(filePointer, filePointer + size);
        
        // Validate Magic Number
        const view = new DataView(resultBuffer);
        const magic = view.getUint32(0, true);

        if (magic === EXPECTED_MAGIC) {
            console.log(`✅ [AUTO-RETRY] SUCCESS! ${strategy} worked. Magic: ${magic}`);
            return resultBuffer; // We found the correct key!
        } else {
            console.warn(`❌ [AUTO-RETRY] ${strategy} produced invalid magic: ${magic} (Expected ${EXPECTED_MAGIC})`);
            // Continue loop to try next key...
        }

    } catch (e) {
        console.error(`🚨 [AUTO-RETRY] Crash in ${strategy}:`, e);
    }
  }

  console.error("🚨 [AUTO-RETRY] All strategies failed. Returning original buffer.");
  return buffer.slice(0);
}

export function encryptEditBin(buffer: ArrayBuffer): ArrayBuffer {
  return buffer.slice(0);
}
