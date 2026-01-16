let modulePromise = null;

async function getModule() {
  if (!modulePromise) {
    modulePromise = createPesCryptoModule();
  }
  return modulePromise;
}

export async function decryptEditBin(data) {
  const mod = await getModule();
  const decrypt = mod.cwrap("decrypt", "number", ["number", "number"]);

  const ptr = mod._malloc(data.length);
  mod.HEAPU8.set(data, ptr);

  decrypt(ptr, data.length);

  const result = mod.HEAPU8.slice(ptr, ptr + data.length);
  mod._free(ptr);

  return result;
}

export async function encryptEditBin(data) {
  const mod = await getModule();
  const encrypt = mod.cwrap("encrypt", "number", ["number", "number"]);

  const ptr = mod._malloc(data.length);
  mod.HEAPU8.set(data, ptr);

  encrypt(ptr, data.length);

  const result = mod.HEAPU8.slice(ptr, ptr + data.length);
  mod._free(ptr);

  return result;
}
