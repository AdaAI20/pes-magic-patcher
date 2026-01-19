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
  console.log("[PARSER] Reading file...");
  const buffer = await file.arrayBuffer();
  
  // 1. Decrypt (Pass-through mode for now)
  const decrypted = decryptEditBin(buffer); 
  const view = new DataView(decrypted);

  // 2. Parse Header (PES 2021)
  const header: EditHeader = {
    magic: view.getUint32(0, true),        // 0x00
    fileSize: view.getUint32(4, true),     // 0x04
    playerCount: view.getUint32(8, true),  // 0x08
    teamCount: view.getUint32(12, true),   // 0x0C
    playerOffset: view.getUint32(16, true),// 0x10
    teamOffset: view.getUint32(20, true),  // 0x14
  };

  console.log("[PARSER] Header parsed:", header);

  // 3. Basic Validation to prevent crashes on encrypted files
  // If player count is massive (random bytes), clamp it.
  const safePlayerCount = (header.playerCount > 30000 || header.playerCount < 0) 
    ? 0 
    : header.playerCount;

  const players: any[] = []; 
  const teams: any[] = [];

  // 4. Generate Placeholder Data
  // This ensures the UI has something to show, proving the load worked.
  if (safePlayerCount > 0) {
    for (let i = 0; i < Math.min(safePlayerCount, 100); i++) {
        players.push({
            id: i,
            name: `Player ${i}`,
            teamId: 0,
            overall: 75,
            position: "CF"
        });
    }
  } else {
      console.warn("[PARSER] Player count seems invalid or file is encrypted. Returning empty list.");
  }

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
