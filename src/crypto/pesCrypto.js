import * as Module from "../wasm/pes_crypto.js";
import { PES_EDIT_KEY } from "./keys";

let wasmReady = false;

export async function initCrypto() {
  wasmReady = true;
}

export function decryptEditBin(buffer) {
  if (!wasmReady) {
    throw new Error("Crypto not initialized");
  }

  const input = new Uint8Array(buffer);
  const len = input.length;

  const dataPtr = Module._malloc(len);
  const keyPtr = Module._malloc(PES_EDIT_KEY.length);

  Module.HEAPU8.set(input, dataPtr);
  Module.HEAPU8.set(PES_EDIT_KEY, keyPtr);

  Module._pes_xor(dataPtr, len, keyPtr, PES_EDIT_KEY.length);

  const output = Module.HEAPU8.slice(dataPtr, dataPtr + len);

  Module._free(dataPtr);
  Module._free(keyPtr);

  return output.buffer;
}
