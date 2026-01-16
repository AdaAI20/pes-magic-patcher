import * as Module from "../wasm/pes_crypto.js";
import { PES_EDIT_KEY } from "./keys";

// Emscripten initializes automatically
export async function initCrypto() {
  // nothing to do, but keeps UI happy
  return true;
}

export function decryptEditBin(buffer) {
  const input = new Uint8Array(buffer);
  const len = input.length;

  // Allocate memory
  const dataPtr = Module._malloc(len);
  const keyPtr = Module._malloc(PES_EDIT_KEY.length);

  // Copy data
  Module.HEAPU8.set(input, dataPtr);
  Module.HEAPU8.set(PES_EDIT_KEY, keyPtr);

  // CALL REAL PES DECRYPT
  // Signature: decrypt(dataPtr, size, keyPtr)
  Module._decrypt(dataPtr, len, keyPtr);

  // Read back result
  const output = Module.HEAPU8.slice(dataPtr, dataPtr + len);

  // Free memory
  Module._free(dataPtr);
  Module._free(keyPtr);

  return output.buffer;
}

export function encryptEditBin(buffer) {
  const input = new Uint8Array(buffer);
  const len = input.length;

  const dataPtr = Module._malloc(len);
  const keyPtr = Module._malloc(PES_EDIT_KEY.length);

  Module.HEAPU8.set(input, dataPtr);
  Module.HEAPU8.set(PES_EDIT_KEY, keyPtr);

  Module._encrypt(dataPtr, len, keyPtr);

  const output = Module.HEAPU8.slice(dataPtr, dataPtr + len);

  Module._free(dataPtr);
  Module._free(keyPtr);

  return output.buffer;
}
