import { decryptEditBin, encryptEditBin } from "@/crypto/pesCrypto";

export interface EditHeader {
  magic: number;
  fileSize: number;
  playerCount: number;
  teamCount: number;
  playerOffset: number;
  teamOffset: number;
}

// Helper to read strings (PES uses UTF-8 or ASCII usually)
function readString(view: DataView, offset: number, maxLength: number): string {
  let str = "";
  for (let i = 0; i < maxLength; i++) {
    const charCode = view.getUint8(offset + i);
    if (charCode === 0) break; // Null terminator
    str += String.fromCharCode(charCode);
  }
  // Clean up garbage characters if encrypted
  return str.replace(/[^\x20-\x7E]/g, "?");
}

export async function loadEditBin(file: File) {
  console.log("[PARSER] Reading file...");
  const buffer = await file.arrayBuffer();
  
  // 1. Decrypt (Currently Pass-through)
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

  const players: any[] = []; 
  const teams: any[] = [];

  // 3. Setup Loop
  // PES 2021 Player Entry Size is typically 116 bytes
  const ENTRY_SIZE = 116; 
  
  // Detect if encrypted based on header values (if count is huge, it's encrypted)
  const isEncrypted = header.playerCount > 50000;
  
  // If encrypted, we just read 50 rows starting at offset 100 to show "something"
  // If valid, we use the real header values
  const loopCount = isEncrypted ? 50 : Math.min(header.playerCount, 2000);
  const startOffset = isEncrypted ? 100 : header.playerOffset;

  console.log(`[PARSER] Reading ${loopCount} players from offset ${startOffset}...`);

  for (let i = 0; i < loopCount; i++) {
    const offset = startOffset + (i * ENTRY_SIZE);
    
    if (offset + ENTRY_SIZE > decrypted.byteLength) break;

    // --- PES 2021 Player Structure Mapping (Approximate) ---
    // 0x00: Player ID (4 bytes)
    // 0x04: Unknown / ID related
    // 0x42: Player Name (Assume ~30 bytes max)
    // 0x??: Stats (To be mapped later)
    
    const id = view.getUint32(offset, true);
    
    // Attempt to read name at offset + 66 (0x42) - This is a common name position
    // If encrypted, this will result in "??????"
    const name = readString(view, offset + 66, 32); 

    // Fake stat reading for UI test
    const overall = view.getUint8(offset + 10) % 99; 

    // We only add the player if it has a non-zero ID
    if (id !== 0) {
      players.push({
        id: id, 
        name: name.length > 1 ? name : `Player ${id} (No Name)`, 
        teamId: 0,
        overall: overall,
        position: "CF", // Placeholder
      });
    }
  }

  console.log(`[PARSER] Done. Loaded ${players.length} items.`);

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
