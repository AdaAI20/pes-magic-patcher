import { decryptEditBin, encryptEditBin } from "@/crypto/pesCrypto";

export interface EditHeader {
  magic: number;
  fileSize: number;
  playerCount: number;
  teamCount: number;
  playerOffset: number;
  teamOffset: number;
}

export async function loadEditBin(file: File) {
  const buffer = await file.arrayBuffer();
  
  // 1. Decrypt
  // Note: ensure pesCrypto.ts exports 'decryptEditBin'
  const decrypted = decryptEditBin(buffer); 
  const view = new DataView(decrypted);

  // 2. Parse Header (PES 2021 Structure - Little Endian)
  // These offsets are standard for EDIT00000000
  const header: EditHeader = {
    magic: view.getUint32(0, true),        // 0x00
    fileSize: view.getUint32(4, true),     // 0x04
    playerCount: view.getUint32(8, true),  // 0x08
    teamCount: view.getUint32(12, true),   // 0x0C
    playerOffset: view.getUint32(16, true),// 0x10
    teamOffset: view.getUint32(20, true),  // 0x14
  };

  console.log("[PARSER] Header parsed:", header);

  // 3. Validation (Optional but good for debugging)
  if (header.playerOffset === 0 || header.playerOffset > decrypted.byteLength) {
    console.warn("[PARSER] Suspicious player offset:", header.playerOffset);
  }

  // 4. Placeholder for parsing lists (We will implement the loop later)
  // Returning empty arrays prevents the UI from crashing
  const players: any[] = []; 
  const teams: any[] = [];

  // 5. Return structure matching fileStore.ts expectation
  return {
    header,
    players,
    teams,
    raw: decrypted // Keep raw buffer for re-saving later
  };
}

export function exportEditBin(data: ArrayBuffer) {
  // 1. Encrypt
  const encrypted = encryptEditBin(data);
  
  // 2. Return Blob for download
  return new Blob([encrypted], { type: "application/octet-stream" });
}
