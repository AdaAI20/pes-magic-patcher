// src/parsers/optionFileParser.ts
// PES EDIT file parser - handles decrypted EDIT files

import { decryptEditBin, initCrypto } from '../crypto/pesCrypto';

// EDIT file structure constants (from decrypted format)
const EDIT_HEADER = {
  VERSION_OFFSET: 0x00,
  HEADER_SIZE_OFFSET: 0x04,
  DATA_SIZE_OFFSET: 0x08,
  PLAYER_COUNT_OFFSET: 0x0C,
  TEAM_COUNT_OFFSET: 0x10,
  // Player data typically starts after the header
  PLAYER_DATA_START: 0x50, // 80 bytes header
};

// Player entry structure
const PLAYER_ENTRY = {
  SIZE: 124, // Typical PES 2021 player entry size
  ID_OFFSET: 0x00,
  NAME_OFFSET: 0x04,
  NAME_LENGTH: 46, // UTF-16LE, 23 characters
  SHIRT_NAME_OFFSET: 0x34,
  SHIRT_NAME_LENGTH: 32,
  NATIONALITY_OFFSET: 0x54,
  AGE_OFFSET: 0x56,
  HEIGHT_OFFSET: 0x58,
  WEIGHT_OFFSET: 0x59,
  POSITION_OFFSET: 0x5A,
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
  headerSize: number;
  dataSize: number;
}

export async function parseOptionFile(file: File): Promise<ParsedEditData> {
  console.log('[PARSER] Starting to parse:', file.name);
  
  await initCrypto();
  
  const buffer = await file.arrayBuffer();
  const decryptedBuffer = decryptEditBin(buffer);
  const data = new Uint8Array(decryptedBuffer);
  const view = new DataView(decryptedBuffer);
  
  console.log('[PARSER] Data size:', data.length);
  console.log('[PARSER] First 32 bytes:', formatHex(data.slice(0, 32)));

  // Read header
  const version = view.getUint32(EDIT_HEADER.VERSION_OFFSET, true);
  const headerSize = view.getUint32(EDIT_HEADER.HEADER_SIZE_OFFSET, true);
  const dataSize = view.getUint32(EDIT_HEADER.DATA_SIZE_OFFSET, true);
  
  console.log('[PARSER] Version:', version);
  console.log('[PARSER] Header size:', headerSize);
  console.log('[PARSER] Data size:', dataSize);

  // Detect if this is a valid decrypted file
  if (version > 0x20 || headerSize > 0x200 || headerSize === 0) {
    console.log('[PARSER] Invalid header, trying to find player data...');
    return findPlayerData(data);
  }

  // Parse players
  const players = parsePlayersFromHeader(data, view, headerSize);
  
  console.log('[PARSER] Parsed', players.length, 'players');
  
  return {
    players,
    teams: [],
    version,
    headerSize,
    dataSize
  };
}

function parsePlayersFromHeader(
  data: Uint8Array, 
  view: DataView, 
  headerSize: number
): Player[] {
  const players: Player[] = [];
  
  // Try to read player count from header
  let playerCount = 0;
  if (headerSize >= 0x10) {
    playerCount = view.getUint32(EDIT_HEADER.PLAYER_COUNT_OFFSET, true);
  }
  
  // Sanity check
  if (playerCount > 50000 || playerCount === 0) {
    console.log('[PARSER] Invalid player count:', playerCount, '- scanning for players...');
    return scanForPlayers(data, headerSize);
  }
  
  console.log('[PARSER] Player count from header:', playerCount);
  
  // Calculate player data start
  const playerDataStart = headerSize > 0 ? headerSize : EDIT_HEADER.PLAYER_DATA_START;
  
  // Try different entry sizes
  const entrySizes = [124, 128, 140, 188, 180, 160];
  
  for (const entrySize of entrySizes) {
    const testPlayers = tryParseWithEntrySize(data, playerDataStart, playerCount, entrySize);
    if (testPlayers.length > 0 && hasValidPlayerNames(testPlayers)) {
      console.log('[PARSER] Found valid players with entry size:', entrySize);
      return testPlayers;
    }
  }
  
  // Fallback: scan for players
  return scanForPlayers(data, playerDataStart);
}

function tryParseWithEntrySize(
  data: Uint8Array, 
  startOffset: number, 
  count: number, 
  entrySize: number
): Player[] {
  const players: Player[] = [];
  const view = new DataView(data.buffer);
  const maxPlayers = Math.min(count, 1000);
  
  for (let i = 0; i < maxPlayers; i++) {
    const offset = startOffset + (i * entrySize);
    
    if (offset + entrySize > data.length) break;
    
    try {
      const player = readPlayerEntry(data, view, offset, entrySize);
      if (player) {
        players.push(player);
      }
    } catch (e) {
      // Continue
    }
  }
  
  return players;
}

function readPlayerEntry(
  data: Uint8Array, 
  view: DataView, 
  offset: number,
  entrySize: number
): Player | null {
  // Read player ID
  const id = view.getUint32(offset, true);
  
  // Validate ID
  if (id === 0 || id > 0xFFFFFF) return null;
  
  // Try to find name at various offsets
  const nameOffsets = [0x04, 0x08, 0x0C, 0x10, 0x2C, 0x30];
  let name = '';
  let nameOffset = 0;
  
  for (const nOffset of nameOffsets) {
    if (offset + nOffset + 46 > data.length) continue;
    const testName = readUtf16String(data, offset + nOffset, 46);
    if (isValidPlayerName(testName)) {
      name = testName;
      nameOffset = nOffset;
      break;
    }
  }
  
  if (!name) return null;
  
  // Read shirt name
  const shirtNameOffset = nameOffset + 48;
  const shirtName = offset + shirtNameOffset + 32 <= data.length 
    ? readUtf16String(data, offset + shirtNameOffset, 32)
    : '';
  
  // Read other fields (approximate offsets)
  const metaOffset = shirtNameOffset + 32;
  const nationality = offset + metaOffset + 2 <= data.length 
    ? view.getUint16(offset + metaOffset, true) : 0;
  const age = offset + metaOffset + 3 <= data.length 
    ? data[offset + metaOffset + 2] : 0;
  const height = offset + metaOffset + 4 <= data.length 
    ? data[offset + metaOffset + 3] : 0;
  const weight = offset + metaOffset + 5 <= data.length 
    ? data[offset + metaOffset + 4] : 0;
  const position = offset + metaOffset + 6 <= data.length 
    ? data[offset + metaOffset + 5] : 0;
  
  return {
    id,
    name,
    shirtName,
    nationality,
    age: age > 0 && age < 60 ? age : 0,
    height: height > 100 && height < 230 ? height : 0,
    weight: weight > 40 && weight < 150 ? weight : 0,
    position: position < 20 ? position : 0,
    offset
  };
}

function scanForPlayers(data: Uint8Array, startOffset: number): Player[] {
  console.log('[PARSER] Scanning for players starting at:', startOffset);
  
  const players: Player[] = [];
  const view = new DataView(data.buffer);
  
  // Look for UTF-16LE strings that look like names
  for (let i = startOffset; i < data.length - 50 && players.length < 500; i += 2) {
    // Check for capital letter followed by null byte (UTF-16LE)
    if (data[i] >= 0x41 && data[i] <= 0x5A && data[i + 1] === 0) {
      const name = readUtf16String(data, i, 46);
      
      if (isValidPlayerName(name) && name.length >= 3) {
        // Try to find player ID before the name
        // Usually ID is 4 bytes before name
        let id = 0;
        for (const idOffset of [4, 8, 12, 16]) {
          if (i - idOffset >= 0) {
            const testId = view.getUint32(i - idOffset, true);
            if (testId > 0 && testId < 0xFFFFFF) {
              id = testId;
              break;
            }
          }
        }
        
        players.push({
          id: id || players.length + 1,
          name,
          shirtName: '',
          nationality: 0,
          age: 0,
          height: 0,
          weight: 0,
          position: 0,
          offset: i
        });
        
        // Skip past this name
        i += name.length * 2 + 50;
      }
    }
  }
  
  console.log('[PARSER] Found', players.length, 'players by scanning');
  return players;
}

function findPlayerData(data: Uint8Array): ParsedEditData {
  console.log('[PARSER] Searching for player data in unknown format...');
  
  const players = scanForPlayers(data, 0);
  
  return {
    players,
    teams: [],
    version: 0,
    headerSize: 0,
    dataSize: data.length
  };
}

function readUtf16String(data: Uint8Array, offset: number, maxBytes: number): string {
  let result = '';
  
  for (let i = 0; i < maxBytes && offset + i + 1 < data.length; i += 2) {
    const charCode = data[offset + i] | (data[offset + i + 1] << 8);
    if (charCode === 0) break;
    if (charCode >= 0x20 && charCode < 0xFFFF) {
      result += String.fromCharCode(charCode);
    } else {
      break;
    }
  }
  
  return result.trim();
}

function isValidPlayerName(name: string): boolean {
  if (!name || name.length < 2 || name.length > 30) return false;
  
  // Must start with a letter
  if (!/^[A-Za-z]/.test(name)) return false;
  
  // Must be mostly letters/spaces
  const validChars = name.match(/[A-Za-z\s\-'.]/g);
  if (!validChars || validChars.length < name.length * 0.7) return false;
  
  return true;
}

function hasValidPlayerNames(players: Player[]): boolean {
  if (players.length === 0) return false;
  
  const validCount = players.filter(p => isValidPlayerName(p.name)).length;
  return validCount / players.length > 0.5;
}

function formatHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join(' ');
}

export { parseOptionFile as parseEditFile };
