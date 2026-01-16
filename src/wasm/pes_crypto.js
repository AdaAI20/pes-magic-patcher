// ===============================
// VITE + ESM SAFE EMSCRIPTEN FILE
// ===============================

// --- Module bootstrap ---
var Module = typeof Module !== "undefined" ? Module : {};

Module.locateFile = function (path) {
  if (path.endsWith(".wasm")) {
    return "/pes_crypto.wasm";
  }
  return path;
};

// ===============================
// ENVIRONMENT DETECTION
// ===============================

var ENVIRONMENT_IS_WEB = typeof window === "object";

// ===============================
// SAFE SCRIPT DIRECTORY (VITE FIX)
// ===============================

var scriptDirectory = "";
if (ENVIRONMENT_IS_WEB) {
  // 🔥 THIS IS THE CRITICAL FIX
  scriptDirectory = new URL(".", import.meta.url).href;
}

// ===============================
// FETCH HELPERS
// ===============================

var readAsync = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load ${url}`);
  }
  return response.arrayBuffer();
};

// ===============================
// WASM INSTANTIATION
// ===============================

async function createWasm() {
  const wasmUrl = Module.locateFile("pes_crypto.wasm");

  const binary = await readAsync(wasmUrl);

  const { instance } = await WebAssembly.instantiate(binary, {
    a: {},
  });

  return instance.exports;
}

// ===============================
// 🚨 DO NOT AUTO-RUN
// ===============================

// ❌ NO createWasm();
// ❌ NO run();

// ===============================
// ✅ ESM EXPORT
// ===============================

export default createWasm;
