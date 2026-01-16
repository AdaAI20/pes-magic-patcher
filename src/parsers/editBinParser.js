import { decryptEditBin } from "../crypto/pesCrypto";

export async function loadEditBin(file) {
  const buffer = await file.arrayBuffer();
  const decrypted = decryptEditBin(buffer);

  return {
    raw: decrypted,
    size: decrypted.byteLength
  };
}

export function exportEditBin(data) {
  // For now, export raw buffer (encryption comes later in STEP A2/A3)
  return new Blob([data], { type: "application/octet-stream" });
}
