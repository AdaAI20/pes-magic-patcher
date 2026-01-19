/* eslint-disable @typescript-eslint/no-explicit-any */

let wasmInstance: WebAssembly.Instance | null = null;
// We will grab memory directly from the instance every time to ensure it's fresh
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

    // Initial memory: 200 pages (~12.8MB)
    const memory = new WebAssembly.Memory({ initial: 200, maximum: 10000 });
    
    const { instance } = await WebAssembly.instantiate(bytes, { 
      env: { memory } 
    });
    
    wasmInstance = instance;
    cryptoReady = true;
    console.log("✅ [DEBUGGER] WASM Initialized.");

  } catch (err) {
    console.error("🚨 [DEBUGGER] Init Failed:", err);
  }
}

function getMemory(): WebAssembly.Memory {
  if (!wasmInstance) throw new Error("WASM not loaded");
  // Always prefer the exported memory if available (it handles growth correctly)
  return (wasmInstance.exports.memory as WebAssembly.Memory);
}

export function decryptEditBin(buffer: ArrayBuffer): ArrayBuffer {
  console.log("🔍 [DEBUGGER] decryptEditBin called");

  if (!cryptoReady || !wasmInstance) {
    console.warn("[CRYPTO] Not ready - passing through");
    return buffer.slice(0);
  }

  try {
    const func = wasmInstance.exports.decrypt_edit as CallableFunction;
    const memory = getMemory();
    
    // 1. Calculate Safe Pointer
    // Default to 1MB offset if __heap_base is missing
    const heapBase = (wasmInstance.exports.__heap_base as WebAssembly.Global)?.value || 1048576;
    const RUST_RESERVE = 5 * 1024 * 1024; // 5MB gap
    const filePointer = heapBase + RUST_RESERVE;
    const fileSize = buffer.byteLength;
    const endPointer = filePointer + fileSize;

    // 2. Ensure Memory Size
    if (memory.buffer.byteLength < endPointer) {
      const missingBytes = endPointer - memory.buffer.byteLength;
      const missingPages = Math.ceil(missingBytes / 65536) + 5; // +5 pages safety
      console.log(`🔍 [DEBUGGER] Growing memory by ${missingPages} pages...`);
      memory.grow(missingPages);
    }

    // 3. Write Data (Create view freshly)
    new Uint8Array(memory.buffer).set(new Uint8Array(buffer), filePointer);

    // 4. Execute Rust (decrypt in-place)
    console.log(`🔍 [DEBUGGER] Running Decrypt at ${filePointer} (Size: ${fileSize})...`);
    func(filePointer, fileSize);

    // 5. Read Result (Create view freshly AGAIN because Rust might have grown memory)
    const freshBuffer = memory.buffer;
    
    // Safety check before slice
    if (freshBuffer.byteLength < endPointer) {
        throw new Error(`Memory shrank? Buffer: ${freshBuffer.byteLength}, Needed: ${endPointer}`);
    }

    const result = freshBuffer.slice(filePointer, endPointer);
    
    // Check Result Magic
    const view = new DataView(result);
    const magic = view.getUint32(0, true);
    console.log(`✅ [DEBUGGER] Decryption Finished. Header Magic: ${magic} (0xE990F62D is expected for PES21)`);

    return result;

  } catch (err) {
    console.error("🚨 [DEBUGGER] Crash inside decrypt:", err);
    return buffer.slice(0);
  }
}

export function encryptEditBin(buffer: ArrayBuffer): ArrayBuffer {
  // Pass-through for now until decrypt is verified
  return buffer.slice(0);
}
