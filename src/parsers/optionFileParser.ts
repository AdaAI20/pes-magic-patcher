// src/parsers/optionFileParser.ts
// PES 2021 EDIT file parser - ASCII names

import { decryptEditBin, initCrypto } from '../crypto/pesCrypto';

// EDIT file header structure
const HEADER = {
  VERSION: 0x00,        // 4 bytes
  HEADER_SIZE: 0x04,    // 4 bytes (usually 80 = 0x50)
  DATA_SIZE: 0x08,      // 4 bytes
  PLAYER_COUNT: 0x0C,   // 4 bytes
  TEAM_COUNT: 0x10,     // 4 bytes
};

// Player entry structure (PES 2021 decrypted format)
const PLAYER_ENTRY = {
  SIZE: 112,            // Approximate entry size
  
  // Offsets within each entry
  ID: 0x00,             // 4 bytes
  NAME: 0x5A,           // ASCII string, null-terminated
  NAME_MAX_LEN: 46,
  SHIRT_NAME: 0x90,     // ASCII string
  SHIRT_NAME_MAX_LEN: 18,
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
  console.log('[PARSER] First 32 bytes:', formatHex(data.slice(0, 32)));

  // Read header
  const version = view.getUint32(HEADER.VERSION, true);
  const headerSize = view.getUint32(HEADER.HEADER_SIZE, true);
  const dataSize = view.getUint32(HEADER.DATA_SIZE, true);
  const playerCount = view.getUint32(HEADER.PLAYER_COUNT, true);
  
  console.log('[PARSER] Version:', version);
  console.log('[PARSER] Header size:', headerSize);
  console.log('[PARSER] Data size:', dataSize);
  console.log('[PARSER] Player count:', playerCount);

  // Validate header
  if (version > 100 || headerSize === 0 || headerSize > 1000) {
    console.log('[PARSER] Invalid header, falling back to scan mode');
    return scanForPlayers(data);
  }

  // Find player data
  const players = findAndParsePlayersByASCII(data, headerSize, Math.min(playerCount, 20000));
  
  console.log('[PARSER] ✅ Parsed', players.length, 'players');
  
  return {
    players,
    teams: [],
    version,
    playerCount
  };
}

function findAndParsePlayersByASCII(
  data: Uint8Array, 
  startOffset: number,
  expectedCount: number
): Player[] {
  console.log('[PARSER] Scanning for ASCII names starting at 0x' + startOffset.toString(16));
  
  const players: Player[] = [];
  const foundOffsets: number[] = [];
  
  // First pass: find all potential player names
  for (let i = startOffset; i < data.length - 20 && foundOffsets.length < expectedCount + 100; i++) {
    // Look for pattern: uppercase letter followed by more name chars
    if (isNameStart(data, i)) {
      const name = readAsciiString(data, i, 46);
      
      if (isValidPlayerName(name)) {
        foundOffsets.push(i);
        // Skip past this name
        i += name.length + 10;
      }
    }
  }
  
  console.log('[PARSER] Found', foundOffsets.length, 'potential name positions');
  
  if (foundOffsets.length === 0) {
    return [];
  }
  
  // Analyze entry size
  const entrySizes: number[] = [];
  for (let i = 1; i < Math.min(20, foundOffsets.length); i++) {
    entrySizes.push(foundOffsets[i] - foundOffsets[i - 1]);
  }
  
  // Find most common entry size
  const sizeCount: Record<number, number> = {};
  for (const size of entrySizes) {
    sizeCount[size] = (sizeCount[size] || 0) + 1;
  }
  
  let mostCommonSize = 112; // default
  let maxCount = 0;
  for (const [size, count] of Object.entries(sizeCount)) {
    if (count > maxCount) {
      maxCount = count;
      mostCommonSize = parseInt(size);
    }
  }
  
  console.log('[PARSER] Detected entry size:', mostCommonSize);
  
  // Second pass: parse players with known structure
  const view = new DataView(data.buffer);
  
  // Find first player entry start
  const firstNameOffset = foundOffsets[0];
  // Entry likely starts before the name
  const possibleEntryStarts = [0, 20, 40, 60, 80, 90];
  
  let entryStart = startOffset;
  let nameOffsetInEntry = firstNameOffset - startOffset;
  
  // Find where entry actually starts relative to name
  for (const offset of possibleEntryStarts) {
    if (firstNameOffset - offset >= startOffset) {
      const testStart = firstNameOffset - offset;
      // Check if this looks like a valid entry start (usually has ID)
      const testId = view.getUint32(testStart, true);
      if (testId > 0 && testId < 0xFFFFFF) {
        entryStart = testStart;
        nameOffsetInEntry = offset;
        break;
      }
    }
  }
  
  console.log('[PARSER] Entry start:', '0x' + entryStart.toString(16));
  console.log('[PARSER] Name offset in entry:', nameOffsetInEntry);
  
  // Parse players
  for (let i = 0; i < Math.min(expectedCount, foundOffsets.length); i++) {
    const nameOffset = foundOffsets[i];
    const entryOffset = nameOffset - nameOffsetInEntry;
    
    if (entryOffset < 0 || entryOffset + mostCommonSize > data.length) continue;
    
    const name = readAsciiString(data, nameOffset, 46);
    
    // Try to read ID (usually 4 bytes at entry start)
    let id = i + 1;
    if (entryOffset >= 0 && entryOffset + 4 <= data.length) {
      const possibleId = view.getUint32(entryOffset, true);
      if (possibleId > 0 && possibleId < 0xFFFFFF) {
        id = possibleId;
      }
    }
    
    // Try to read shirt name (usually after player name)
    let shirtName = '';
    const shirtOffset = nameOffset + 46 + 10; // Approximate
    if (shirtOffset + 18 < data.length) {
      shirtName = readAsciiString(data, shirtOffset, 18);
      if (!isValidShirtName(shirtName)) {
        shirtName = '';
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
  }
  
  return players;
}

function scanForPlayers(data: Uint8Array): ParsedEditData {
  console.log('[PARSER] Full scan mode...');
  
  const players: Player[] = [];
  
  for (let i = 0; i < data.length - 10 && players.length < 500; i++) {
    if (isNameStart(data, i)) {
      const name = readAsciiString(data, i, 46);
      
      if (isValidPlayerName(name)) {
        players.push({
          id: players.length + 1,
          name,
          shirtName: '',
          nationality: 0,
          age: 0,
          height: 0,
          weight: 0,
          position: 0,
          offset: i
        });
        
        i += name.length + 50;
      }
    }
  }
  
  return {
    players,
    teams: [],
    version: 0,
    playerCount: players.length
  };
}

function isNameStart(data: Uint8Array, offset: number): boolean {
  if (offset + 3 >= data.length) return false;
  
  const c0 = data[offset];
  const c1 = data[offset + 1];
  
  // Uppercase letter followed by lowercase or "."
  if (c0 >= 65 && c0 <= 90) { // A-Z
    if ((c1 >= 97 && c1 <= 122) || c1 === 46 || c1 === 32 || c1 === 39) {
      return true;
    }
  }
  
  return false;
}

function readAsciiString(data: Uint8Array, offset: number, maxLen: number): string {
  let result = '';
  
  for (let i = 0; i < maxLen && offset + i < data.length; i++) {
    const c = data[offset + i];
    
    if (c === 0) break; // Null terminator
    
    // Valid ASCII printable characters
    if (c >= 32 && c < 127) {
      result += String.fromCharCode(c);
    } else {
      break;
    }
  }
  
  return result.trim();
}

function isValidPlayerName(name: string): boolean {
  if (!name || name.length < 2 || name.length > 40) return false;
  
  // Must start with uppercase
  if (!/^[A-Z]/.test(name)) return false;
  
  // Must have mostly letters
  const letters = name.match(/[A-Za-z]/g);
  if (!letters || letters.length < name.length * 0.6) return false;
  
  // Common patterns: "L. MESSI", "RONALDO", "De Bruyne"
  if (/^[A-Z][a-z]/.test(name) || /^[A-Z]\. [A-Z]/.test(name) || /^[A-Z]{2,}/.test(name)) {
    return true;
  }
  
  return false;
}

function isValidShirtName(name: string): boolean {
  if (!name || name.length < 2 || name.length > 18) return false;
  
  // Shirt names are usually all uppercase
  const upper = name.match(/[A-Z]/g);
  return upper !== null && upper.length >= name.length * 0.5;
}

function formatHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join(' ');
}

export { parseOptionFile as parseEditFile };
