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
    console.log("🔍 [DEBUGGER] 1. Fetching WASM from:", path);
    
    const response = await fetch(path);
    if (!response.ok) throw new Error(`WASM 404 at ${path}`);
    
    const bytes = await response.arrayBuffer();

    // Create memory with enough initial space (200 pages = ~12.8MB)
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
    console.log("✅ [DEBUGGER] WASM Initialized.");

  } catch (err) {
    console.error("🚨 [DEBUGGER] Init Failed:", err);
  }
}

export function decryptEditBin(buffer: ArrayBuffer): ArrayBuffer {
  console.log("🔍 [DEBUGGER] decryptEditBin called");

  if (!cryptoReady || !wasmInstance || !wasmMemory) {
    console.warn("[CRYPTO] Not ready - passing through");
    return buffer.slice(0);
  }

  try {
    const func = wasmInstance.exports.decrypt_edit as CallableFunction;
    const heapBase = wasmInstance.exports.__heap_base as WebAssembly.Global;
    
    // 1. Calculate Safe Pointer
    // Rust allocator starts at __heap_base. 
    // We leave a 5MB gap for Rust internal allocations.
    const HEAP_START = heapBase ? heapBase.value : 1048576; 
    const RUST_RESERVE = 5 * 1024 * 1024; 
    const filePointer = HEAP_START + RUST_RESERVE;
    const fileSize = buffer.byteLength;

    // 2. Ensure Memory Size
    const requiredBytes = filePointer + fileSize;
    const currentBytes = wasmMemory.buffer.byteLength;
    
    if (requiredBytes > currentBytes) {
      const missingBytes = requiredBytes - currentBytes;
      const missingPages = Math.ceil(missingBytes / 65536) + 10;
      console.log(`🔍 [DEBUGGER] Growing memory by ${missingPages} pages...`);
      wasmMemory.grow(missingPages);
    }

    // 3. Write Data
    // Get a FRESH view of the memory
    new Uint8Array(wasmMemory.buffer).set(new Uint8Array(buffer), filePointer);

    // 4. Execute Rust (decrypt in-place at filePointer)
    console.log(`🔍 [DEBUGGER] Running Decrypt at offset ${filePointer} (Size: ${fileSize})...`);
    func(filePointer, fileSize);

    // 5. Read Result
    // 🔥 CRITICAL FIX: Re-acquire the buffer here because Rust might have grown memory,
    // detaching the previous view.
    const freshMemView = new Uint8Array(wasmMemory.buffer);
    const result = freshMemView.slice(filePointer, filePointer + fileSize).buffer;
    
    // Check Result Magic
    const view = new DataView(result);
    const magic = view.getUint32(0, true);
    console.log(`✅ [DEBUGGER] Decryption Finished. Header Magic: ${magic}`);

    return result;

  } catch (err) {
    console.error("🚨 [DEBUGGER] Crash inside decrypt:", err);
    return buffer.slice(0);
  }
}

export function encryptEditBin(buffer: ArrayBuffer): ArrayBuffer {
  // Pass through for now
  return buffer.slice(0);
}
