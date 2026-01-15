import { decryptBuffer } from "@/crypto/pesCrypto";

export async function loadEditBin(file: File) {
  const encrypted = new Uint8Array(await file.arrayBuffer());
  const decrypted = decryptBuffer(encrypted);

  return {
    raw: decrypted,
    size: decrypted.length
  };
}

export function exportEditBin(data: Uint8Array) {
  const encrypted = decryptBuffer(data);
  return new Blob([encrypted], { type: "application/octet-stream" });
}
