import Module from "../wasm/pes_crypto.js";

let wasm: any;

export async function initCrypto() {
  if (!wasm) {
    wasm = await Module();
  }
}

export function decryptBuffer(data: Uint8Array, key = 0xaa): Uint8Array {
  const ptr = wasm._malloc(data.length);
  wasm.HEAPU8.set(data, ptr);

  wasm._decrypt(ptr, data.length, key);

  const out = wasm.HEAPU8.slice(ptr, ptr + data.length);
  wasm._free(ptr);
  return out;
}
