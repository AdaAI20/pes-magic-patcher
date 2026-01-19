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
  
  // 1. Decrypt (Pass-through)
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

  console.log("[PARSER] Header values (Encrypted/Garbage):", header);

  const players: any[] = []; 
  const teams: any[] = [];

  // 3. SAFE PARSING MODE
  // Since the file is encrypted, the header values are random numbers (e.g. 1.9 billion).
  // We ignore them and force a read of 50 items to populate the UI.
  
  const SAFE_LOOP_COUNT = 50; 
  const ENTRY_SIZE = 116; // Approx PES player size
  const START_OFFSET = 100; // Skip header

  console.log(`[PARSER] Force-reading ${SAFE_LOOP_COUNT} raw entries for UI verification...`);

  for (let i = 0; i < SAFE_LOOP_COUNT; i++) {
    const offset = START_OFFSET + (i * ENTRY_SIZE);
    
    // Boundary check
    if (offset + ENTRY_SIZE > decrypted.byteLength) break;

    // Read ID (likely garbage data right now)
    const id = view.getUint32(offset, true);
    
    // Push dummy data so the table has rows
    players.push({
      id: id, 
      name: `Raw Entry ${i + 1}`, 
      teamId: 0,
      overall: view.getUint8(offset + 10) % 99, // Fake rating 0-99
      position: "UNK",
    });
  }

  console.log(`[PARSER] Finished. Generated ${players.length} safe entries.`);

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
