// src/parsers/optionFileParser.ts
// PES 2021 EDIT file parser - FINAL VERSION

import { decryptEditBin, initCrypto } from '../crypto/pesCrypto';

// File structure constants
const HEADER_SIZE = 80;           // 0x50
const PLAYER_ENTRY_SIZE = 312;    // 0x138
const FIRST_PLAYER_OFFSET = 178;  // 0xB2 - where first name starts

// Within each 312-byte entry, name is at offset 98 (0x62) from entry start
// Entry start = 0xB2 - 0x62 = 0x50 (80) = right after header!
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

export interface ParsedEditData {
  players: Player[];
  teams: any[];
  version: number;
  playerCount: number;
}

export async function parseOptionFile(file: File): Promise<ParsedEditData> {
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
  console.log('[PARSER] Player count (header):', playerCountHeader);

  // Validate decrypted file
  if (version > 100 || headerSize === 0 || headerSize > 500) {
    console.log('[PARSER] ⚠️ File may not be properly decrypted');
    return { players: [], teams: [], version: 0, playerCount: 0 };
  }

  // Parse players using fixed structure
  const players = parsePlayersFixed(data, view, headerSize, playerCountHeader);
  
  console.log('[PARSER] ✅ Loaded', players.length, 'players');
  
  return {
    players,
    teams: [],
    version,
    playerCount: players.length
  };
}

function parsePlayersFixed(
  data: Uint8Array,
  view: DataView,
  headerSize: number,
  expectedCount: number
): Player[] {
  const players: Player[] = [];
  const seenNames = new Set<string>();
  
  // Player entries start right after header
  const entryStart = headerSize; // 80 bytes
  const maxPlayers = Math.min(expectedCount, 15000);
  
  console.log('[PARSER] Entry start:', entryStart, 'Entry size:', PLAYER_ENTRY_SIZE);
  
  for (let i = 0; i < maxPlayers; i++) {
    const offset = entryStart + (i * PLAYER_ENTRY_SIZE);
    
    if (offset + PLAYER_ENTRY_SIZE > data.length) {
      console.log('[PARSER] Reached end of file at entry', i);
      break;
    }
    
    // Read player name at fixed offset within entry
    const nameOffset = offset + NAME_OFFSET_IN_ENTRY;
    const name = readAsciiName(data, nameOffset, 46);
    
    // Skip if no valid name or duplicate
    if (!name || name.length < 3) continue;
    if (!isValidPlayerName(name)) continue;
    if (seenNames.has(name)) continue;
    
    seenNames.add(name);
    
    // Read player ID (usually at entry start)
    let id = view.getUint32(offset, true);
    if (id === 0 || id > 0xFFFFFF) {
      id = players.length + 1;
    }
    
    // Read shirt name (after player name, with some gap)
    const shirtOffset = nameOffset + 46 + 15; // Approximate
    let shirtName = '';
    if (shirtOffset + 18 < data.length) {
      shirtName = readAsciiName(data, shirtOffset, 18);
      if (!isShirtName(shirtName)) shirtName = '';
    }
    
    // Read other attributes (approximate offsets)
    const attrOffset = offset + 160; // Approximate location of attributes
    let age = 0, height = 0, weight = 0, position = 0, nationality = 0;
    
    if (attrOffset + 10 < data.length) {
      const ageVal = data[attrOffset];
      const heightVal = data[attrOffset + 1];
      const weightVal = data[attrOffset + 2];
      const posVal = data[attrOffset + 3];
      
      if (ageVal > 15 && ageVal < 50) age = ageVal;
      if (heightVal > 150 && heightVal < 210) height = heightVal;
      if (weightVal > 50 && weightVal < 120) weight = weightVal;
      if (posVal < 15) position = posVal;
    }
    
    players.push({
      id,
      name,
      shirtName,
      nationality,
      age,
      height,
      weight,
      position,
      offset
    });
  }
  
  // Log sample of parsed players
  console.log('[PARSER] Sample players:');
  players.slice(0, 10).forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.name} (ID: ${p.id})`);
  });
  
  return players;
}

function readAsciiName(data: Uint8Array, offset: number, maxLen: number): string {
  let result = '';
  
  for (let i = 0; i < maxLen && offset + i < data.length; i++) {
    const c = data[offset + i];
    
    if (c === 0) break; // Null terminator
    
    // Valid name characters
    if ((c >= 65 && c <= 90) ||   // A-Z
        (c >= 97 && c <= 122) ||  // a-z
        c === 32 ||               // space
        c === 46 ||               // .
        c === 39 ||               // '
        c === 45) {               // -
      result += String.fromCharCode(c);
    } else {
      break;
    }
  }
  
  return result.trim();
}

function isValidPlayerName(name: string): boolean {
  if (!name || name.length < 3 || name.length > 35) return false;
  
  // Must start with uppercase
  if (!/^[A-Z]/.test(name)) return false;
  
  // Pattern: "X. SURNAME" (initial + period + space + surname)
  if (/^[A-Z]\. [A-Z][A-Z]+/.test(name)) return true;
  if (/^[A-Z]\. [A-Z][a-z]+/.test(name)) return true;
  
  // Pattern: "FULL NAME" (all caps with spaces)
  if (/^[A-Z][A-Z\s'.]+[A-Z]$/.test(name) && name.length >= 4) return true;
  
  // Pattern: "Name Surname" (mixed case)
  if (/^[A-Z][a-z]+ [A-Z][a-z]+/.test(name)) return true;
  
  // Pattern: "De/Van/O' Surname"
  if (/^(De|Van|Von|Le|La|Di|Da|O')[A-Z\s]/.test(name)) return true;
  
  return false;
}

function isShirtName(name: string): boolean {
  if (!name || name.length < 3 || name.length > 18) return false;
  
  // Shirt names are usually all uppercase
  return /^[A-Z][A-Z\s'.]+$/.test(name);
}

export { parseOptionFile as parseEditFile };
