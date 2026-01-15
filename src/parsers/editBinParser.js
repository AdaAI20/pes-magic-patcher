import { decryptEditBin } from "@/crypto/pesCrypto";

export async function loadEditBin(file) {
  const encrypted = new Uint8Array(await file.arrayBuffer());
  const decrypted = decryptEditBin(encrypted);

  return {
    raw: decrypted,
    size: decrypted.length
  };
}
