import createPesCryptoModule from "../wasm/pes_crypto.js";

let modulePromise = null;

/**
 * Initialize WASM module once
 */
async function getModule() {
  if (!modulePromise) {
    modulePromise = createPesCryptoModule();
  }
  return modulePromise;
}

/**
 * Decrypt PES edit.bin
 * @param {Uint8Array} data
 * @returns {Uint8Array}
 */
export async function decryptEditBin(data) {
  const Module = await getModule();

  const size = data.length;
  const inputPtr = Module._malloc(size);
  const outputPtr = Module._malloc(size);

  Module.HEAPU8.set(data, inputPtr);
  Module._decrypt(inputPtr, outputPtr, size);

  const result = new Uint8Array(Module.HEAPU8.subarray(outputPtr, outputPtr + size));

  Module._free(inputPtr);
  Module._free(outputPtr);

  return result;
}

/**
 * Encrypt PES edit.bin
 * @param {Uint8Array} data
 * @returns {Uint8Array}
 */
export async function encryptEditBin(data) {
  const Module = await getModule();

  const size = data.length;
  const inputPtr = Module._malloc(size);
  const outputPtr = Module._malloc(size);

  Module.HEAPU8.set(data, inputPtr);
  Module._encrypt(inputPtr, outputPtr, size);

  const result = new Uint8Array(Module.HEAPU8.subarray(outputPtr, outputPtr + size));

  Module._free(inputPtr);
  Module._free(outputPtr);

  return result;
}
