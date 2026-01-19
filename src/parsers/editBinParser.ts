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
  
  // 1. Decrypt (Pass-through for now)
  const decrypted = decryptEditBin(buffer); 
  const view = new DataView(decrypted);

  // 2. Parse Header
  const header: EditHeader = {
    magic: view.getUint32(0, true),
    fileSize: view.getUint32(4, true),
    playerCount: view.getUint32(8, true),
    teamCount: view.getUint32(12, true),
    playerOffset: view.getUint32(16, true),
    teamOffset: view.getUint32(20, true),
  };

  console.log("[PARSER] Header:", header);

  // 3. Safety Checks
  // If offsets are wild (encrypted), we clamp them to avoid crashes.
  const isEncrypted = header.playerOffset > decrypted.byteLength || header.playerCount > 100000;
  
  const players: any[] = []; 
  const teams: any[] = [];

  // 4. Parse Players (SAFE MODE)
  // We force a limit of 100 players so the browser never hangs, 
  // even if the file is full of garbage data.
  const loopCount = isEncrypted ? 50 : Math.min(header.playerCount, 50); 
  const playerEntrySize = 116; // Standard PES size
  const startOffset = isEncrypted ? 100 : header.playerOffset; // Fallback offset if encrypted

  console.log(`[PARSER] Attempting to read ${loopCount} players...`);

  for (let i = 0; i < loopCount; i++) {
    const offset = startOffset + (i * playerEntrySize);
    
    // Boundary check
    if (offset + playerEntrySize > decrypted.byteLength) break;

    // Read ID (4 bytes)
    const id = view.getUint32(offset, true);
    
    // Create a dummy player entry
    // If encrypted, these values will be random numbers.
    players.push({
      id: id, 
      name: `Player ${id} (Raw)`, // Placeholder name
      teamId: 0,
      overall: view.getUint8(offset + 10) || 0, // Random byte as rating
      position: "UNK",
    });
  }

  console.log(`[PARSER] Done. Extracted ${players.length} items.`);

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
