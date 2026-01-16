var Module = typeof Module != "undefined" ? Module : {};

/* ✅ FORCE CORRECT WASM PATH FOR VITE / PROD */
Module.locateFile = function () {
  return "/pes_crypto.wasm";
};

var ENVIRONMENT_IS_WEB = !!globalThis.window;
var ENVIRONMENT_IS_WORKER = !!globalThis.WorkerGlobalScope;
var ENVIRONMENT_IS_NODE =
  globalThis.process?.versions?.node &&
  globalThis.process?.type != "renderer";

var arguments_ = [];
var thisProgram = "./this.program";
var quit_ = (status, toThrow) => {
  throw toThrow;
};

var _scriptName = globalThis.document?.currentScript?.src;
if (typeof __filename != "undefined") {
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
  readBinary = (filename) => {
    filename = isFileURI(filename) ? new URL(filename) : filename;
    return fs.readFileSync(filename);
  };
  readAsync = async (filename, binary = true) => {
    filename = isFileURI(filename) ? new URL(filename) : filename;
    return fs.readFileSync(filename, binary ? undefined : "utf8");
  };
  if (process.argv.length > 1) {
    thisProgram = process.argv[1].replace(/\\/g, "/");
  }
  arguments_ = process.argv.slice(2);
  if (typeof module != "undefined") {
    module["exports"] = Module;
  }
  quit_ = (status, toThrow) => {
    process.exitCode = status;
    throw toThrow;
  };
} else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  try {
    scriptDirectory = new URL(".", _scriptName).href;
  } catch {}
  if (ENVIRONMENT_IS_WORKER) {
    readBinary = (url) => {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", url, false);
      xhr.responseType = "arraybuffer";
      xhr.send(null);
      return new Uint8Array(xhr.response);
    };
  }
  readAsync = async (url) => {
    if (isFileURI(url)) {
      return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.responseType = "arraybuffer";
        xhr.onload = () => {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) {
            resolve(xhr.response);
            return;
          }
          reject(xhr.status);
        };
        xhr.onerror = reject;
        xhr.send(null);
      });
    }
    var response = await fetch(url, { credentials: "same-origin" });
    if (response.ok) {
      return response.arrayBuffer();
    }
    throw new Error(response.status + " : " + response.url);
  };
}

var out = console.log.bind(console);
var err = console.error.bind(console);

var wasmBinary;
var ABORT = false;

var isFileURI = (filename) => filename.startsWith("file://");

var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
var HEAP64, HEAPU64;

var runtimeInitialized = false;

function updateMemoryViews() {
  var b = wasmMemory.buffer;
  HEAP8 = new Int8Array(b);
  HEAP16 = new Int16Array(b);
  HEAPU8 = new Uint8Array(b);
  HEAPU16 = new Uint16Array(b);
  HEAP32 = new Int32Array(b);
  HEAPU32 = new Uint32Array(b);
  HEAPF32 = new Float32Array(b);
  HEAPF64 = new Float64Array(b);
  HEAP64 = new BigInt64Array(b);
  HEAPU64 = new BigUint64Array(b);
}

function abort(what) {
  Module["onAbort"]?.(what);
  what = "Aborted(" + what + ")";
  err(what);
  ABORT = true;
  throw new WebAssembly.RuntimeError(what);
}

function findWasmBinary() {
  return locateFile("pes_crypto.wasm");
}

/* --- REST OF FILE CONTINUES UNCHANGED --- */

createWasm();
run();
