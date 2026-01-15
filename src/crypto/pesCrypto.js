import * as ModuleRaw from "../wasm/pes_crypto.js";
const Module = ModuleRaw.default || ModuleRaw;

let wasm;

export async function initCrypto() {
  wasm = await Module();
}

export function decryptBuffer(uint8Array, key = 0xAA) {
  const ptr = wasm._malloc(uint8Array.length);
  wasm.HEAPU8.set(uint8Array, ptr);

  wasm._decrypt(ptr, uint8Array.length, key);

  const out = wasm.HEAPU8.slice(ptr, ptr + uint8Array.length);
  wasm._free(ptr);

  return out;
}
