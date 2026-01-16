import "../wasm/pes_crypto.js";

/**
 * Emscripten exposes Module globally
 */
export function createPesCryptoModule() {
  return new Promise((resolve) => {
    if (globalThis.Module?.onRuntimeInitialized) {
      resolve(globalThis.Module);
    } else {
      globalThis.Module = globalThis.Module || {};
      globalThis.Module.onRuntimeInitialized = () => {
        resolve(globalThis.Module);
      };
    }
  });
}
