import { decryptBuffer } from "../crypto/pesCrypto.js";

export async function loadEditBin(file) {
  const buf = new Uint8Array(await file.arrayBuffer());

  const decrypted = decryptBuffer(buf);

  return {
    raw: decrypted,
    playersOffset: 0x2000, // from 4ccEditor specs
    teamsOffset: 0x8000
  };
}

export function exportEditBin(data) {
  return decryptBuffer(data.raw);
}
