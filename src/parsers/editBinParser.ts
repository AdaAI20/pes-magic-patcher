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
  
  // 1. Decrypt (currently pass-through)
  const decrypted = decryptEditBin(buffer); 
  const view = new DataView(decrypted);

  // 2. Parse Header (PES 2021)
  const header: EditHeader = {
    magic: view.getUint32(0, true),
    fileSize: view.getUint32(4, true),
    playerCount: view.getUint32(8, true),
    teamCount: view.getUint32(12, true),
    playerOffset: view.getUint32(16, true),
    teamOffset: view.getUint32(20, true),
  };

  console.log("[PARSER] Raw Header Values:", header);

  // 3. SANITY CHECK (The Fix for Infinite Loading)
  // A valid EDIT file typically has ~20,000 players max. 
  // If we see > 50,000, the file is definitely encrypted/garbage.
  const isEncrypted = header.playerCount > 50000 || header.playerOffset > decrypted.byteLength;

  const players: any[] = []; 
  const teams: any[] = [];

  if (isEncrypted) {
    console.warn("[PARSER] Detected encrypted/garbage data. Skipping parse loop to prevent crash.");
    // We return empty arrays so the UI finishes loading successfully, 
    // rather than hanging forever.
  } else {
    // Only loop if data looks real
    const safeCount = Math.min(header.playerCount, 50000); 
    const playerEntrySize = 116; // Approx size

    for (let i = 0; i < safeCount; i++) {
      // Safety break to prevent reading past file end
      if (header.playerOffset + (i * playerEntrySize) >= decrypted.byteLength - 4) break;

      const offset = header.playerOffset + (i * playerEntrySize);
      const id = view.getUint32(offset, true);
      
      if (id !== 0) {
        players.push({
          id,
          name: `Player ${id}`,
          teamId: 0,
          overall: 0,
          position: "UNK",
        });
      }
    }
  }

  console.log(`[PARSER] Finished. Loaded ${players.length} players.`);

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
