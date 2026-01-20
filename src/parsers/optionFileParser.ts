// REPLACE THE CONTENT OF YOUR PARSER FILE (whichever is being imported)
// src/parsers/optionFileParser.ts OR src/lib/optionFileParser.ts

import { decryptEditBin, initCrypto } from '../crypto/pesCrypto';

// PES 2021 EDIT file structure
const HEADER_SIZE = 80;
const PLAYER_ENTRY_SIZE = 312;
const NAME_OFFSET_IN_ENTRY = 98;

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

export interface ParsedEditData {
  players: Player[];
  teams: any[];
  version: number;
  playerCount: number;
}

export async function parseOptionFile(file: File): Promise<ParsedEditData> {
  console.log('[PARSER] === NEW PARSER ACTIVE ===');
  console.log('[PARSER] Parsing:', file.name);
  
  await initCrypto();
  
  const buffer = await file.arrayBuffer();
  const decryptedBuffer = decryptEditBin(buffer);
  const data = new Uint8Array(decryptedBuffer);
  const view = new DataView(decryptedBuffer);
  
  console.log('[PARSER] File size:', data.length);

  // Read header
  const version = view.getUint32(0, true);
  const headerSize = view.getUint32(4, true);
  const dataSize = view.getUint32(8, true);
  const playerCountHeader = view.getUint32(12, true);
  
  console.log('[PARSER] Version:', version);
  console.log('[PARSER] Header size:', headerSize);
  console.log('[PARSER] Data size:', dataSize);
  console.log('[PARSER] Player count from header:', playerCountHeader);

  // Check if valid decrypted file
  if (version > 100 || headerSize === 0 || headerSize > 500) {
    console.log('[PARSER] ⚠️ Invalid header - file may not be decrypted');
    return { players: [], teams: [], version: 0, playerCount: 0 };
  }

  // Parse players with fixed 312-byte entries
  const players = parsePlayersWithFixedSize(data, view, headerSize, playerCountHeader);
  
  console.log('[PARSER] ✅ Total players loaded:', players.length);
  
  return {
    players,
    teams: [],
    version,
    playerCount: players.length
  };
}

function parsePlayersWithFixedSize(
  data: Uint8Array,
  view: DataView,
  headerSize: number,
  expectedCount: number
): Player[] {
  const players: Player[] = [];
  const seenNames = new Set<string>();
  
  const entryStart = headerSize; // 80
  const maxPlayers = Math.min(expectedCount, 15000);
  
  console.log('[PARSER] Entry start offset:', entryStart);
  console.log('[PARSER] Entry size:', PLAYER_ENTRY_SIZE);
  console.log('[PARSER] Name offset in entry:', NAME_OFFSET_IN_ENTRY);
  console.log('[PARSER] Expected players:', maxPlayers);

  for (let i = 0; i < maxPlayers; i++) {
    const entryOffset = entryStart + (i * PLAYER_ENTRY_SIZE);
    
    if (entryOffset + PLAYER_ENTRY_SIZE > data.length) {
      console.log('[PARSER] Reached end of file at entry', i);
      break;
    }
    
    // Name is at offset 98 (0x62) within each entry
    const nameOffset = entryOffset + NAME_OFFSET_IN_ENTRY;
    const name = readAsciiName(data, nameOffset, 46);
    
    // Validate name
    if (!name || name.length < 3) continue;
    if (!isValidPlayerName(name)) continue;
    if (seenNames.has(name)) continue;
    
    seenNames.add(name);
    
    // Read player ID (at entry start)
    let id = view.getUint32(entryOffset, true);
    if (id === 0 || id > 0xFFFFFF) {
      id = players.length + 1;
    }
    
    // Read shirt name (after player name with gap)
    const shirtOffset = nameOffset + 50;
    let shirtName = '';
    if (shirtOffset + 18 < data.length) {
      const possibleShirt = readAsciiName(data, shirtOffset, 18);
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

function readAsciiName(data: Uint8Array, offset: number, maxLen: number): string {
  let result = '';
  
  for (let i = 0; i < maxLen && offset + i < data.length; i++) {
    const c = data[offset + i];
    if (c === 0) break;
    
    if ((c >= 65 && c <= 90) || (c >= 97 && c <= 122) || 
        c === 32 || c === 46 || c === 39 || c === 45) {
      result += String.fromCharCode(c);
    } else {
      break;
    }
  }
  
  return result.trim();
}

function isValidPlayerName(name: string): boolean {
  if (!name || name.length < 3 || name.length > 35) return false;
  if (!/^[A-Z]/.test(name)) return false;
  
  // "X. SURNAME" pattern
  if (/^[A-Z]\. [A-Z][A-Z]+/.test(name)) return true;
  if (/^[A-Z]\. [A-Z][a-z]+/.test(name)) return true;
  
  // All caps name
  if (/^[A-Z][A-Z\s'.]+[A-Z]$/.test(name) && name.length >= 4) return true;
  
  // Mixed case "Name Surname"
  if (/^[A-Z][a-z]+ [A-Z][a-z]+/.test(name)) return true;
  
  return false;
}

function isShirtName(name: string): boolean {
  if (!name || name.length < 3 || name.length > 18) return false;
  return /^[A-Z][A-Z\s'.]+$/.test(name);
}

// Also export as parseEditFile for compatibility
export { parseOptionFile as parseEditFile };
