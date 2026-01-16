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
// EMSCRIPTEN GENERATED CODE
// (unchanged, except bottom)
// ===============================

var ENVIRONMENT_IS_WEB = !!globalThis.window;
var ENVIRONMENT_IS_WORKER = !!globalThis.WorkerGlobalScope;
var ENVIRONMENT_IS_NODE =
  globalThis.process?.versions?.node &&
  globalThis.process?.type !== "renderer";

var arguments_ = [];
var thisProgram = "./this.program";
var quit_ = (status, toThrow) => {
  throw toThrow;
};

var _scriptName = globalThis.document?.currentScript?.src;
if (typeof __filename !== "undefined") {
  _scriptName = __filename;
} else if (ENVIRONMENT_IS_WORKER) {
  _scriptName = self.location.href;
}

var scriptDirectory = "";
function locateFile(path) {
  if (Module["locateFile"]) {
    return Module["locateFile"](path, scriptDirectory);
  }
  return scriptDirectory + path;
}

var readAsync, readBinary;

if (ENVIRONMENT_IS_NODE) {
  var fs = require("fs");
  scriptDirectory = __dirname + "/";
  readBinary = (filename) => fs.readFileSync(filename);
  readAsync = async (filename) => fs.readFileSync(filename);
} else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  scriptDirectory = new URL(".", _scriptName).href;
  readAsync = async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(res.statusText);
    return res.arrayBuffer();
  };
}

var out = console.log.bind(console);
var err = console.error.bind(console);

var wasmBinary;
var wasmMemory;
var wasmExports;
var runtimeInitialized = false;

// --- Memory helpers omitted for brevity (unchanged) ---

// ===============================
// WASM INSTANTIATION
// ===============================

async function createWasm() {
  const wasmBinaryFile = locateFile("pes_crypto.wasm");

  const imports = { a: {} };

  const binary = await readAsync(wasmBinaryFile);
  const { instance } = await WebAssembly.instantiate(binary, imports);

  wasmExports = instance.exports;
  wasmMemory = wasmExports.memory;

  runtimeInitialized = true;

  return wasmExports;
}

// ===============================
// 🚨 CRITICAL FIXES
// ===============================

// ❌ REMOVE AUTO EXECUTION
// createWasm();
// run();

// ✅ EXPORT FACTORY FOR VITE
export default createWasm;
