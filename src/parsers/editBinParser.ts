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
  
  // 1. Decrypt (currently pass-through)
  const decrypted = decryptEditBin(buffer); 
  const view = new DataView(decrypted);

  // 2. Safety Check: Ensure file is large enough
  if (decrypted.byteLength < 32) {
    throw new Error("File is too small to be a valid EDIT file.");
  }

  // 3. Parse Header (PES 2021 Structure)
  const header: EditHeader = {
    magic: view.getUint32(0, true),        // 0x00
    fileSize: view.getUint32(4, true),     // 0x04
    playerCount: view.getUint32(8, true),  // 0x08
    teamCount: view.getUint32(12, true),   // 0x0C
    playerOffset: view.getUint32(16, true),// 0x10
    teamOffset: view.getUint32(20, true),  // 0x14
  };

  console.log("[PARSER] Raw Header Values:", header);

  // 4. Validate Header
  // A valid decrypted EDIT file usually has specific offsets.
  // If offsets are massive integers, the file is likely still encrypted.
  if (header.playerOffset > decrypted.byteLength || header.playerOffset < 32) {
    console.warn("[PARSER] header looks invalid (Encrypted?). returning raw data structure.");
    // We throw here so the UI knows something went wrong with parsing, 
    // or you can return a specific error state.
    // For now, we return empty data to prevent UI crash.
    return {
      header,
      players: [],
      teams: [],
      raw: decrypted
    };
  }

  // 5. Parse Players
  const players: any[] = [];
  // Use header info, but force safe limits
  const safePlayerCount = Math.min(header.playerCount, 30000); 
  const playerEntrySize = 116; // Approx size, depends on exact PES version

  // Only attempt loop if offsets look reasonable
  if (header.playerOffset + (safePlayerCount * playerEntrySize) <= decrypted.byteLength) {
    for (let i = 0; i < safePlayerCount; i++) {
      const offset = header.playerOffset + (i * playerEntrySize);
      const id = view.getUint32(offset, true);
      
      // Basic filter for empty slots
      if (id !== 0) {
        players.push({
          id,
          name: `Player ${id}`, // Placeholder until string table logic added
          teamId: 0,
          overall: 0,
          position: "UNK",
        });
      }
    }
  }

  const teams: any[] = []; // Implement Team parsing similarly if needed

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
