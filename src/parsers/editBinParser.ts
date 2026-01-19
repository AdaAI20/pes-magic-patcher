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
  
  const decrypted = decryptEditBin(buffer); 
  const view = new DataView(decrypted);

  const header: EditHeader = {
    magic: view.getUint32(0, true),
    fileSize: view.getUint32(4, true),
    playerCount: view.getUint32(8, true),
    teamCount: view.getUint32(12, true),
    playerOffset: view.getUint32(16, true),
    teamOffset: view.getUint32(20, true),
  };

  console.log("[PARSER] Header parsed:", header);

  if (header.playerOffset === 0 || header.playerOffset > decrypted.byteLength) {
    console.warn("[PARSER] Suspicious player offset:", header.playerOffset);
  }

  // Placeholder arrays
  const players: any[] = []; 
  const teams: any[] = [];

  return {
    header,
    players,
    teams,
    raw: decrypted 
  };
}

export function exportEditBin(data: ArrayBuffer) {
  const encrypted = encryptEditBin(data);
  return new Blob([encrypted], { type: "application/octet-stream" });
}
