import { decryptEditBin, encryptEditBin } from "../crypto/pesCrypto";

/**
 * Load edit.bin
 */
export async function loadEditBin(file) {
  const buffer = new Uint8Array(await file.arrayBuffer());
  const decrypted = await decryptEditBin(buffer);
  return decrypted;
}

/**
 * Export edit.bin
 */
export async function exportEditBin(data) {
  const encrypted = await encryptEditBin(data);
  return new Blob([encrypted], { type: "application/octet-stream" });
}
