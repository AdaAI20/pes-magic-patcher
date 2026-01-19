import { decryptEditBin } from "@/crypto/pesCrypto";

export interface EditHeader {
  magic: number;
  fileSize: number;
  playerCount: number;
  teamCount: number;
  playerOffset: number;
  teamOffset: number;
}

export async function loadEditBin(file: File) {
  console.log("[PARSER] Step 1: Reading file from disk...");
  const buffer = await file.arrayBuffer();
  
  console.log("[PARSER] Step 2: Decrypting (Pass-through)...");
  const decrypted = decryptEditBin(buffer); 
  const view = new DataView(decrypted);

  console.log("[PARSER] Step 3: Reading Header...");
  const header: EditHeader = {
    magic: view.getUint32(0, true),
    fileSize: view.getUint32(4, true),
    playerCount: view.getUint32(8, true),
    teamCount: view.getUint32(12, true),
    playerOffset: view.getUint32(16, true),
    teamOffset: view.getUint32(20, true),
  };

  console.log("[PARSER] Header Result:", header);

  // 🛑 STOP! DO NOT LOOP! 🛑
  // We return empty arrays immediately to prevent the "3 Billion Loop Crash"
  console.log("[PARSER] Step 4: Skipping body parse to prevent freeze.");

  return {
    header,
    players: [], // Empty for now
    teams: [],   // Empty for now
    raw: decrypted 
  };
}

export function exportEditBin(data: ArrayBuffer) {
  return new Blob([data], { type: "application/octet-stream" });
}
