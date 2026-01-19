/* eslint-disable @typescript-eslint/no-explicit-any */

let wasmInstance: WebAssembly.Instance | null = null;
let wasmMemory: WebAssembly.Memory | null = null;
let cryptoReady = false;

// PES 2021 Magic Number
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
    if (!response.ok) throw new Error(`WASM 404`);
    const bytes = await response.arrayBuffer();

    const memory = new WebAssembly.Memory({ initial: 200, maximum: 2000 });
    const { instance } = await WebAssembly.instantiate(bytes, { env: { memory } });
    
    wasmInstance = instance;
    wasmMemory = instance.exports.memory ? (instance.exports.memory as WebAssembly.Memory) : memory;
    cryptoReady = true;
    console.log("✅ [AUTO-RETRY] WASM Loaded.");
  } catch (err) {
    console.error("🚨 [AUTO-RETRY] Init Failed:", err);
  }
}

export function decryptEditBin(buffer: ArrayBuffer): ArrayBuffer {
  if (!cryptoReady || !wasmInstance || !wasmMemory) {
    console.warn("Crypto not ready");
    return buffer.slice(0);
  }

  // Strategies to try
  const strategies = ["decrypt_2021", "decrypt_2020"];

  for (const strategy of strategies) {
    console.log(`🔄 [AUTO-RETRY] Attempting Strategy: ${strategy}...`);

    try {
        const func = wasmInstance.exports[strategy] as CallableFunction;
        if (!func) continue;

        // Fresh Copy
        const workingBuffer = buffer.slice(0);
        const size = workingBuffer.byteLength;

        // Memory Logic
        const heapBase = (wasmInstance.exports.__heap_base as WebAssembly.Global)?.value || 1048576;
        const filePointer = heapBase + 5242880; 

        if (wasmMemory.buffer.byteLength < filePointer + size) {
             const missing = filePointer + size - wasmMemory.buffer.byteLength;
             const pages = Math.ceil(missing / 65536) + 10;
             wasmMemory.grow(pages);
        }

        // Write
        new Uint8Array(wasmMemory.buffer).set(new Uint8Array(workingBuffer), filePointer);

        // Execute
        func(filePointer, size);

        // Read
        const resultBuffer = wasmMemory.buffer.slice(filePointer, filePointer + size);
        
        // Verify
        const view = new DataView(resultBuffer);
        const magic = view.getUint32(0, true);

        if (magic === EXPECTED_MAGIC) {
            console.log(`✅ [AUTO-RETRY] SUCCESS! Key found: ${strategy}`);
            return resultBuffer;
        } else {
            console.warn(`❌ [AUTO-RETRY] ${strategy} Failed. Magic: ${magic}`);
        }

    } catch (e) {
        console.error(`🚨 [AUTO-RETRY] Crash in ${strategy}:`, e);
    }
  }

  console.error("🚨 [AUTO-RETRY] ALL KEYS FAILED.");
  return buffer.slice(0);
}

export function encryptEditBin(buffer: ArrayBuffer): ArrayBuffer {
  return buffer.slice(0);
}
