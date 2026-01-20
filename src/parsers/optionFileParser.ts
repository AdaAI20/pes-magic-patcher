// src/parsers/optionFileParser.ts
// PES 2021 EDIT file parser - Final version with ASCII names

import { decryptEditBin, initCrypto } from '../crypto/pesCrypto';

// Header structure
const HEADER = {
  VERSION: 0x00,
  HEADER_SIZE: 0x04,
  DATA_SIZE: 0x08,
  PLAYER_COUNT: 0x0C,
};

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
  console.log('[PARSER] Starting to parse:', file.name);
  
  await initCrypto();
  
  const buffer = await file.arrayBuffer();
  const decryptedBuffer = decryptEditBin(buffer);
  const data = new Uint8Array(decryptedBuffer);
  const view = new DataView(decryptedBuffer);
  
  console.log('[PARSER] File size:', data.length);

  // Read header
  const version = view.getUint32(HEADER.VERSION, true);
  const headerSize = view.getUint32(HEADER.HEADER_SIZE, true);
  const dataSize = view.getUint32(HEADER.DATA_SIZE, true);
  const playerCount = view.getUint32(HEADER.PLAYER_COUNT, true);
  
  console.log('[PARSER] Version:', version, 'Header:', headerSize, 'Players:', playerCount);

  // Validate - check if it's a valid decrypted file
  if (version > 100 || headerSize === 0 || headerSize > 500) {
    console.log('[PARSER] File may not be properly decrypted');
    return { players: [], teams: [], version: 0, playerCount: 0 };
  }

  // Find all real player names
  const players = extractPlayers(data, view, headerSize, playerCount);
  
  console.log('[PARSER] ✅ Extracted', players.length, 'players');
  
  return {
    players,
    teams: [],
    version,
    playerCount: players.length
  };
}

function extractPlayers(
  data: Uint8Array,
  view: DataView,
  headerSize: number,
  expectedCount: number
): Player[] {
  const players: Player[] = [];
  const namePositions: Array<{ offset: number; name: string }> = [];
  
  // First pass: find all REAL player names (strict validation)
  for (let i = headerSize; i < data.length - 20 && namePositions.length < expectedCount * 2; i++) {
    if (isRealNameStart(data, i)) {
      const name = readPlayerName(data, i);
      
      if (isRealPlayerName(name)) {
        namePositions.push({ offset: i, name });
        i += name.length; // Skip past this name
      }
    }
  }
  
  console.log('[PARSER] Found', namePositions.length, 'name candidates');
  
  if (namePositions.length === 0) {
    return [];
  }
  
  // Log first 10 names for debugging
  console.log('[PARSER] First 10 names:');
  namePositions.slice(0, 10).forEach((n, i) => {
    console.log(`  ${i + 1}. "${n.name}" at 0x${n.offset.toString(16)}`);
  });
  
  // Analyze entry structure
  // Names often appear multiple times per player (display name, shirt name, etc.)
  // Find the typical spacing between unique players
  
  const uniqueNames = new Map<string, number>();
  for (const { offset, name } of namePositions) {
    // Only keep first occurrence of each name
    if (!uniqueNames.has(name)) {
      uniqueNames.set(name, offset);
    }
  }
  
  console.log('[PARSER] Unique names:', uniqueNames.size);
  
  // Convert to player entries
  const offsets = Array.from(uniqueNames.entries());
  offsets.sort((a, b) => a[1] - b[1]); // Sort by offset
  
  // Calculate typical entry size
  const gaps: number[] = [];
  for (let i = 1; i < Math.min(50, offsets.length); i++) {
    const gap = offsets[i][1] - offsets[i - 1][1];
    if (gap > 50 && gap < 1000) { // Reasonable entry size range
      gaps.push(gap);
    }
  }
  
  // Find most common gap (entry size)
  const gapCount: Record<number, number> = {};
  for (const gap of gaps) {
    // Round to nearest 8 bytes (common alignment)
    const rounded = Math.round(gap / 8) * 8;
    gapCount[rounded] = (gapCount[rounded] || 0) + 1;
  }
  
  let entrySize = 312; // Default
  let maxCount = 0;
  for (const [size, count] of Object.entries(gapCount)) {
    if (count > maxCount) {
      maxCount = count;
      entrySize = parseInt(size);
    }
  }
  
  console.log('[PARSER] Detected entry size:', entrySize);
  
  // Create player entries
  for (let i = 0; i < offsets.length && players.length < expectedCount; i++) {
    const [name, nameOffset] = offsets[i];
    
    // Estimate entry start (name is usually not at beginning of entry)
    // Look backwards for a reasonable ID
    let id = players.length + 1;
    let entryStart = nameOffset;
    
    // Try to find player ID before the name
    for (let backOffset = 4; backOffset <= 100; backOffset += 4) {
      if (nameOffset - backOffset < headerSize) break;
      
      const possibleId = view.getUint32(nameOffset - backOffset, true);
      if (possibleId > 0 && possibleId < 0xFFFFFF) {
        // This could be the player ID
        id = possibleId;
        entryStart = nameOffset - backOffset;
        break;
      }
    }
    
    // Look for shirt name (usually after player name, all uppercase)
    let shirtName = '';
    for (let searchOffset = nameOffset + name.length + 1; 
         searchOffset < nameOffset + 100 && searchOffset < data.length - 10; 
         searchOffset++) {
      if (data[searchOffset] >= 65 && data[searchOffset] <= 90) {
        const testName = readPlayerName(data, searchOffset);
        if (testName.length >= 3 && isShirtName(testName)) {
          shirtName = testName;
          break;
        }
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
      offset: entryStart
    });
  }
  
  return players;
}

function isRealNameStart(data: Uint8Array, offset: number): boolean {
  if (offset + 4 >= data.length) return false;
  
  const c0 = data[offset];
  const c1 = data[offset + 1];
  const c2 = data[offset + 2];
  
  // Pattern 1: "X. SURNAME" (initial + period + space + uppercase)
  if (c0 >= 65 && c0 <= 90 && c1 === 46 && c2 === 32) {
    const c3 = data[offset + 3];
    if (c3 >= 65 && c3 <= 90) {
      return true;
    }
  }
  
  // Pattern 2: "SURNAME" (all uppercase, at least 3 chars)
  if (c0 >= 65 && c0 <= 90 && c1 >= 65 && c1 <= 90 && c2 >= 65 && c2 <= 90) {
    return true;
  }
  
  // Pattern 3: "Surname" (capitalized, followed by lowercase)
  if (c0 >= 65 && c0 <= 90 && c1 >= 97 && c1 <= 122 && c2 >= 97 && c2 <= 122) {
    return true;
  }
  
  return false;
}

function readPlayerName(data: Uint8Array, offset: number): string {
  let result = '';
  
  for (let i = 0; i < 40 && offset + i < data.length; i++) {
    const c = data[offset + i];
    
    if (c === 0) break; // Null terminator
    
    // Valid name characters: A-Z, a-z, space, period, apostrophe, hyphen
    if ((c >= 65 && c <= 90) ||   // A-Z
        (c >= 97 && c <= 122) ||  // a-z
        c === 32 ||               // space
        c === 46 ||               // period
        c === 39 ||               // apostrophe
        c === 45) {               // hyphen
      result += String.fromCharCode(c);
    } else {
      break; // Invalid character
    }
  }
  
  return result.trim();
}

function isRealPlayerName(name: string): boolean {
  if (!name || name.length < 3 || name.length > 35) return false;
  
  // Must start with uppercase letter
  if (!/^[A-Z]/.test(name)) return false;
  
  // Filter out garbage patterns
  // Real names shouldn't have random character sequences
  
  // Pattern: "X. SURNAME" - valid
  if (/^[A-Z]\. [A-Z][A-Z]+$/.test(name)) return true;
  
  // Pattern: "X. Surname" - valid
  if (/^[A-Z]\. [A-Z][a-z]+/.test(name)) return true;
  
  // Pattern: "SURNAME" (all caps, no weird chars) - valid
  if (/^[A-Z][A-Z][A-Z]+$/.test(name) && !/[^A-Z\s]/.test(name)) return true;
  
  // Pattern: "Van Surname" - valid
  if (/^[A-Z][a-z]+ [A-Z][a-z]+/.test(name)) return true;
  
  // Pattern: full names with spaces - valid  
  if (/^[A-Z][A-Z\s'.-]+$/.test(name) && name.length >= 4) {
    // Check it has at least one vowel (real names usually do)
    if (/[AEIOU]/.test(name)) return true;
  }
  
  // Pattern: "De Surname", "Van Surname", "O'Surname"
  if (/^(De|Van|Von|Le|La|Di|Da|O')[A-Z\s]/.test(name)) return true;
  
  return false;
}

function isShirtName(name: string): boolean {
  if (!name || name.length < 3 || name.length > 18) return false;
  
  // Shirt names are usually all uppercase
  if (/^[A-Z][A-Z\s'.-]+$/.test(name)) {
    // Should have vowels
    if (/[AEIOU]/.test(name)) return true;
  }
  
  return false;
}

function formatHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join(' ');
}

export { parseOptionFile as parseEditFile };
