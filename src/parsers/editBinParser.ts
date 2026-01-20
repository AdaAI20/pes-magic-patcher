// src/parsers/editBinParser.ts
// PES 2021 EDIT file parser - CORRECT FILE

import { decryptEditBin, initCrypto } from '../crypto/pesCrypto';

// PES 2021 EDIT file structure
const HEADER_SIZE = 80;           // 0x50
const PLAYER_ENTRY_SIZE = 312;    // 0x138
const NAME_OFFSET_IN_ENTRY = 98;  // 0x62

export interface Player {
  id: number;
  name: string;
  shirtName: string;
  nationality: number;
  age: number;
  height: number;
  weight: number;
  position: number;
  offset: number;
}

export interface EditBinHeader {
  magic: number;
  version: number;
  fileSize: number;
  playerCount: number;
  teamCount: number;
}

export interface EditBinData {
  header: EditBinHeader;
  raw: ArrayBuffer;
  players: Player[];
}

export async function loadEditBin(file: File): Promise<EditBinData> {
  console.log('[PARSER] === LOADING EDIT FILE ===');
  console.log('[PARSER] File:', file.name);
  console.log('[PARSER] Size:', file.size, 'bytes');
  
  await initCrypto();
  
  const buffer = await file.arrayBuffer();
  const decryptedBuffer = decryptEditBin(buffer);
  const data = new Uint8Array(decryptedBuffer);
  const view = new DataView(decryptedBuffer);
  
  // Read header
  const version = view.getUint32(0, true);
  const headerSize = view.getUint32(4, true);
  const dataSize = view.getUint32(8, true);
  const playerCountFromHeader = view.getUint32(12, true);
  const teamCount = view.getUint32(16, true);
  
  console.log('[PARSER] Version:', version);
  console.log('[PARSER] Header size:', headerSize);
  console.log('[PARSER] Data size:', dataSize);
  console.log('[PARSER] Player count (header):', playerCountFromHeader);

  // Build header object
  const header: EditBinHeader = {
    magic: version,
    version: version,
    fileSize: dataSize,
    playerCount: playerCountFromHeader,
    teamCount: teamCount,
  };

  // Check if valid decrypted file
  if (version > 100 || headerSize === 0 || headerSize > 500) {
    console.log('[PARSER] ⚠️ File may not be properly decrypted');
    console.log('[PARSER] Attempting to parse anyway...');
  }

  // Parse players using 312-byte fixed entries
  const players = parsePlayersFromEditBin(data, view, headerSize, playerCountFromHeader);
  
  console.log('[PARSER] ✅ Successfully loaded', players.length, 'players');
  
  return {
    header,
    raw: decryptedBuffer,
    players
  };
}

function parsePlayersFromEditBin(
  data: Uint8Array,
  view: DataView,
  headerSize: number,
  expectedCount: number
): Player[] {
  const players: Player[] = [];
  const seenNames = new Set<string>();
  
  // Use actual header size or default to 80
  const entryStart = headerSize > 0 && headerSize < 500 ? headerSize : HEADER_SIZE;
  const maxPlayers = Math.min(expectedCount || 15000, 15000);
  
  console.log('[PARSER] Entry start offset:', entryStart);
  console.log('[PARSER] Entry size:', PLAYER_ENTRY_SIZE, 'bytes');
  console.log('[PARSER] Name offset in entry:', NAME_OFFSET_IN_ENTRY);
  console.log('[PARSER] Max players to read:', maxPlayers);

  for (let i = 0; i < maxPlayers; i++) {
    const entryOffset = entryStart + (i * PLAYER_ENTRY_SIZE);
    
    // Check if we've reached end of file
    if (entryOffset + PLAYER_ENTRY_SIZE > data.length) {
      console.log('[PARSER] Reached end of file at entry', i);
      break;
    }
    
    // Name is at offset 98 (0x62) within each 312-byte entry
    const nameOffset = entryOffset + NAME_OFFSET_IN_ENTRY;
    const name = readAsciiString(data, nameOffset, 46);
    
    // Skip invalid entries
    if (!name || name.length < 3) continue;
    if (!isValidPlayerName(name)) continue;
    
    // Skip duplicates
    if (seenNames.has(name)) continue;
    seenNames.add(name);
    
    // Read player ID (usually at entry start)
    let id = 0;
    try {
      id = view.getUint32(entryOffset, true);
      if (id === 0 || id > 0xFFFFFF) {
        id = players.length + 1;
      }
    } catch {
      id = players.length + 1;
    }
    
    // Try to read shirt name (after player name)
    let shirtName = '';
    const shirtOffset = nameOffset + 50;
    if (shirtOffset + 18 < data.length) {
      const possibleShirt = readAsciiString(data, shirtOffset, 18);
      if (isShirtName(possibleShirt)) {
        shirtName = possibleShirt;
      }
    }
    
    players.push({
      id,
      name,
      shirtName,
      nationality: 0,
      age: 0,
      height: 0,
      weight: 0,
      position: 0,
      offset: entryOffset
    });
    
    // Log first 10 players for verification
    if (players.length <= 10) {
      console.log(`[PARSER] Player ${players.length}: "${name}" (ID: ${id})`);
    }
  }
  
  return players;
}

function readAsciiString(data: Uint8Array, offset: number, maxLen: number): string {
  let result = '';
  
  for (let i = 0; i < maxLen && offset + i < data.length; i++) {
    const c = data[offset + i];
    
    if (c === 0) break; // Null terminator
    
    // Valid ASCII name characters: A-Z, a-z, space, period, apostrophe, hyphen
    if ((c >= 65 && c <= 90) ||   // A-Z
        (c >= 97 && c <= 122) ||  // a-z
        c === 32 ||               // space
        c === 46 ||               // . (period)
        c === 39 ||               // ' (apostrophe)
        c === 45) {               // - (hyphen)
      result += String.fromCharCode(c);
    } else {
      break; // Invalid character ends the string
    }
  }
  
  return result.trim();
}

function isValidPlayerName(name: string): boolean {
  if (!name || name.length < 3 || name.length > 35) return false;
  
  // Must start with uppercase letter
  if (!/^[A-Z]/.test(name)) return false;
  
  // Pattern: "X. SURNAME" (like "L. MESSI", "C. RONALDO")
  if (/^[A-Z]\. [A-Z][A-Z]+/.test(name)) return true;
  
  // Pattern: "X. Surname" (like "R. Giggs")
  if (/^[A-Z]\. [A-Z][a-z]+/.test(name)) return true;
  
  // Pattern: All uppercase "SURNAME" (like "RONALDO")
  if (/^[A-Z][A-Z\s'.]+[A-Z]$/.test(name) && name.length >= 4) return true;
  
  // Pattern: "Firstname Lastname"
  if (/^[A-Z][a-z]+ [A-Z][a-z]+/.test(name)) return true;
  
  // Pattern: "De/Van/O' Surname"
  if (/^(De|Van|Von|Le|La|Di|Da|O')[A-Z\s]/.test(name)) return true;
  
  return false;
}

function isShirtName(name: string): boolean {
  if (!name || name.length < 3 || name.length > 18) return false;
  
  // Shirt names are typically all uppercase
  return /^[A-Z][A-Z\s'.]+$/.test(name);
}

// Legacy export for compatibility
export async function parseEditBin(file: File) {
  return loadEditBin(file);
}
