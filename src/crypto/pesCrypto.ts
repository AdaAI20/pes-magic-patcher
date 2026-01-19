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
    const size = bytes.byteLength;
    console.log(`🔍 [DEBUGGER] 2. WASM Downloaded. Size: ${size} bytes`);

    // CHECK: Is this the Dummy file?
    if (size < 1000) {
        console.warn("🚨 [DEBUGGER] WARNING: This looks like the DUMMY file (<1KB).");
        console.warn("🚨 [DEBUGGER] Real crypto requires the 21KB+ file.");
    } else {
        console.log("✅ [DEBUGGER] File size looks correct for Real Crypto.");
    }

    // Memory setup
    const memory = new WebAssembly.Memory({ initial: 200, maximum: 2000 });
    const { instance } = await WebAssembly.instantiate(bytes, { env: { memory } });
    
    wasmInstance = instance;
    
    // Handle memory export differences
    if (instance.exports.memory) {
      wasmMemory = instance.exports.memory as WebAssembly.Memory;
    } else {
      wasmMemory = memory;
    }

    cryptoReady = true;
    console.log("🔍 [DEBUGGER] 3. Instantiated. Exports:", Object.keys(instance.exports));

  } catch (err) {
    console.error("🚨 [DEBUGGER] Init Failed:", err);
  }
}

export function decryptEditBin(buffer: ArrayBuffer): ArrayBuffer {
  console.log("🔍 [DEBUGGER] 4. decryptEditBin called");

  if (!cryptoReady || !wasmInstance || !wasmMemory) {
    console.error("🚨 [DEBUGGER] CRITICAL: Crypto not ready yet! Returning raw buffer.");
    return buffer.slice(0);
  }

  try {
    const funcName = "decrypt_edit";
    const func = wasmInstance.exports[funcName] as CallableFunction;

    if (!func) {
      console.error(`🚨 [DEBUGGER] Function '${funcName}' NOT FOUND in WASM.`);
      return buffer.slice(0);
    }

    const size = buffer.byteLength;
    
    // Memory Growth Logic
    const currentPages = wasmMemory.buffer.byteLength / 65536;
    const neededPages = Math.ceil(size / 65536) + 10;
    
    if (neededPages > currentPages) {
      console.log(`🔍 [DEBUGGER] Growing memory...`);
      wasmMemory.grow(neededPages - currentPages);
    }

    const memView = new Uint8Array(wasmMemory.buffer);
    
    // 1. Write
    memView.set(new Uint8Array(buffer), 0);

    // 2. Execute
    console.log(`🔍 [DEBUGGER] 5. Running Rust Decryption on ${size} bytes...`);
    func(0, size);

    // 3. Read
    const result = memView.slice(0, size).buffer;
    
    // Check Result header
    const view = new DataView(result);
    const magic = view.getUint32(0, true); // Should NOT be garbage if successful
    console.log(`🔍 [DEBUGGER] 6. Decryption Done. Header Magic: ${magic}`);

    return result;

  } catch (err) {
    console.error("🚨 [DEBUGGER] Crash inside decrypt:", err);
    return buffer.slice(0);
  }
}

export function encryptEditBin(buffer: ArrayBuffer): ArrayBuffer {
  return buffer.slice(0);
}
