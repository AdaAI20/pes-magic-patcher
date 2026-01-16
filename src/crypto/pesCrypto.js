import createPesCryptoModule from "../wasm/pes_crypto.js";

let wasmModule = null;

async function getModule() {
  if (!wasmModule) {
    wasmModule = await createPesCryptoModule();
  }
  return wasmModule;
}

export async function decrypt(buffer) {
  const Module = await getModule();

  const inputPtr = Module._malloc(buffer.length);
  Module.HEAPU8.set(buffer, inputPtr);

  const outputPtr = Module._decrypt(inputPtr, buffer.length);

  const result = Module.HEAPU8.slice(outputPtr, outputPtr + buffer.length);

  Module._free(inputPtr);
  Module._free(outputPtr);

  return result;
}

export async function encrypt(buffer) {
  const Module = await getModule();

  const inputPtr = Module._malloc(buffer.length);
  Module.HEAPU8.set(buffer, inputPtr);

  const outputPtr = Module._encrypt(inputPtr, buffer.length);

  const result = Module.HEAPU8.slice(outputPtr, outputPtr + buffer.length);

  Module._free(inputPtr);
  Module._free(outputPtr);

  return result;
}
