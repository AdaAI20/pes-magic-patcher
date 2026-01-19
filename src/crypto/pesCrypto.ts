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
    console.log("🔍 [AUTO-RETRY] Fetching WASM:", path);
    
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

  // Define the strategies available in our Rust WASM
  const strategies = ["decrypt_v1", "decrypt_v2"];

  for (const strategy of strategies) {
    console.log(`🔄 [AUTO-RETRY] Attempting Method: ${strategy}...`);

    try {
        // 1. Create a FRESH copy of the input buffer (so we can retry if fail)
        const workingBuffer = buffer.slice(0);
        const size = workingBuffer.byteLength;

        // 2. Prepare Memory
        const heapBase = (wasmInstance.exports.__heap_base as WebAssembly.Global)?.value || 1048576;
        const filePointer = heapBase + 5242880; // 5MB gap

        if (wasmMemory.buffer.byteLength < filePointer + size) {
            wasmMemory.grow(Math.ceil((filePointer + size - wasmMemory.buffer.byteLength) / 65536) + 5);
        }

        // 3. Write Data
        new Uint8Array(wasmMemory.buffer).set(new Uint8Array(workingBuffer), filePointer);

        // 4. Execute Rust Function
        const func = wasmInstance.exports[strategy] as CallableFunction;
        if (!func) continue;
        func(filePointer, size);

        // 5. Read Result
        const resultBuffer = wasmMemory.buffer.slice(filePointer, filePointer + size);
        
        // 6. CHECK MAGIC NUMBER
        const view = new DataView(resultBuffer);
        const magic = view.getUint32(0, true);

        if (magic === EXPECTED_MAGIC) {
            console.log(`✅ [AUTO-RETRY] SUCCESS! Method ${strategy} worked. Magic: ${magic}`);
            return resultBuffer; // Return successful decrypt
        } else {
            console.warn(`❌ [AUTO-RETRY] Method ${strategy} failed. Got Magic: ${magic} (Expected ${EXPECTED_MAGIC})`);
            // Loop continues to next strategy...
        }

    } catch (e) {
        console.error(`🚨 [AUTO-RETRY] Crash in ${strategy}:`, e);
    }
  }

  console.error("🚨 [AUTO-RETRY] ALL METHODS FAILED. Returning raw buffer.");
  return buffer.slice(0);
}

export function encryptEditBin(buffer: ArrayBuffer): ArrayBuffer {
  return buffer.slice(0);
}
