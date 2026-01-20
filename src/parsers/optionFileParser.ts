// src/parsers/optionFileParser.ts
import { decryptEditBin, initCrypto } from '../crypto/pesCrypto';

// PES 2021 EDIT file structure constants
const EDIT_STRUCTURE = {
  // Header info
  HEADER_SIZE: 0x40,
  
  // Player table
  PLAYER_TABLE_OFFSET: 0x8C74,      // Start of player entries
  PLAYER_ENTRY_SIZE: 188,           // Bytes per player
  PLAYER_COUNT_OFFSET: 0x8C70,      // Where player count is stored
  MAX_PLAYERS: 25000,
  
  // Player entry offsets (within each entry)
  PLAYER_ID_OFFSET: 0x00,           // 4 bytes - Player ID
  PLAYER_NAME_OFFSET: 0x2C,         // 46 bytes - Player name (UTF-16LE)
  PLAYER_NAME_LENGTH: 46,
  PLAYER_SHIRT_NAME_OFFSET: 0x5A,   // 32 bytes - Shirt name
  PLAYER_SHIRT_NAME_LENGTH: 32,
  PLAYER_NATIONALITY_OFFSET: 0x7A,  // 2 bytes
  PLAYER_AGE_OFFSET: 0x7C,          // 1 byte
  PLAYER_HEIGHT_OFFSET: 0x7D,       // 1 byte
  PLAYER_WEIGHT_OFFSET: 0x7E,       // 1 byte
  PLAYER_POSITION_OFFSET: 0x7F,     // 1 byte
  
  // Team table
  TEAM_TABLE_OFFSET: 0x1DE74,
  TEAM_ENTRY_SIZE: 456,
  TEAM_NAME_OFFSET: 0x00,
  TEAM_NAME_LENGTH: 70,
};

// Alternative offsets to try (different EDIT versions)
const ALTERNATIVE_OFFSETS = [
  { playerTable: 0x8C74, playerCount: 0x8C70 },
  { playerTable: 0x8A74, playerCount: 0x8A70 },
  { playerTable: 0x9074, playerCount: 0x9070 },
  { playerTable: 0x1000, playerCount: 0x0FFC },
  { playerTable: 0x2000, playerCount: 0x1FFC },
  { playerTable: 0x0100, playerCount: 0x00FC },
  { playerTable: 0x0040, playerCount: 0x003C },
];

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
  rawData?: Uint8Array;
}

export interface ParsedEditData {
  players: Player[];
  teams?: any[];
  version: string;
  decrypted: boolean;
}

export async function parseOptionFile(file: File): Promise<ParsedEditData> {
  console.log('[PARSER] Starting to parse:', file.name);
  
  // Initialize crypto
  await initCrypto();
  
  // Read file
  const buffer = await file.arrayBuffer();
  console.log('[PARSER] File size:', buffer.byteLength);
  
  // Decrypt
  const decryptedBuffer = decryptEditBin(buffer);
  const data = new Uint8Array(decryptedBuffer);
  
  console.log('[PARSER] Decrypted. First 64 bytes:');
  logHexDump(data, 0, 64);
  
  // Try to find player table
  const result = findAndParsePlayerTable(data);
  
  return result;
}

function findAndParsePlayerTable(data: Uint8Array): ParsedEditData {
  const view = new DataView(data.buffer);
  
  // Try each offset configuration
  for (const offsets of ALTERNATIVE_OFFSETS) {
    console.log(`[PARSER] Trying offset: 0x${offsets.playerTable.toString(16)}`);
    
    if (offsets.playerCount + 4 > data.length) continue;
    if (offsets.playerTable + EDIT_STRUCTURE.PLAYER_ENTRY_SIZE > data.length) continue;
    
    // Read player count
    const playerCount = view.getUint32(offsets.playerCount, true);
    
    // Validate player count (should be reasonable)
    if (playerCount > 0 && playerCount < EDIT_STRUCTURE.MAX_PLAYERS) {
      console.log(`[PARSER] Found ${playerCount} players at offset 0x${offsets.playerTable.toString(16)}`);
      
      // Try to read first player and validate
      const firstPlayer = readPlayerEntry(data, offsets.playerTable);
      
      if (isValidPlayer(firstPlayer)) {
        console.log('[PARSER] First player looks valid:', firstPlayer.name);
        
        // Parse all players
        const players = parsePlayersFromOffset(data, offsets.playerTable, playerCount);
        
        if (players.length > 0) {
          console.log(`[PARSER] Successfully parsed ${players.length} players`);
          return {
            players,
            version: 'PES2021',
            decrypted: true
          };
        }
      }
    }
  }
  
  // If standard offsets fail, try to scan for player data
  console.log('[PARSER] Standard offsets failed, scanning for player data...');
  const scannedPlayers = scanForPlayerData(data);
  
  if (scannedPlayers.length > 0) {
    console.log(`[PARSER] Found ${scannedPlayers.length} players via scanning`);
    return {
      players: scannedPlayers,
      version: 'PES2021-scanned',
      decrypted: true
    };
  }
  
  console.warn('[PARSER] Could not find valid player data');
  return {
    players: [],
    version: 'unknown',
    decrypted: true
  };
}

function readPlayerEntry(data: Uint8Array, offset: number): Player {
  const view = new DataView(data.buffer);
  
  // Read player ID
  const id = view.getUint32(offset + EDIT_STRUCTURE.PLAYER_ID_OFFSET, true);
  
  // Read player name (UTF-16LE)
  const nameBytes = data.slice(
    offset + EDIT_STRUCTURE.PLAYER_NAME_OFFSET,
    offset + EDIT_STRUCTURE.PLAYER_NAME_OFFSET + EDIT_STRUCTURE.PLAYER_NAME_LENGTH
  );
  const name = decodeUTF16LE(nameBytes);
  
  // Read shirt name
  const shirtNameBytes = data.slice(
    offset + EDIT_STRUCTURE.PLAYER_SHIRT_NAME_OFFSET,
    offset + EDIT_STRUCTURE.PLAYER_SHIRT_NAME_OFFSET + EDIT_STRUCTURE.PLAYER_SHIRT_NAME_LENGTH
  );
  const shirtName = decodeUTF16LE(shirtNameBytes);
  
  // Read other attributes
  const nationality = view.getUint16(offset + EDIT_STRUCTURE.PLAYER_NATIONALITY_OFFSET, true);
  const age = data[offset + EDIT_STRUCTURE.PLAYER_AGE_OFFSET];
  const height = data[offset + EDIT_STRUCTURE.PLAYER_HEIGHT_OFFSET];
  const weight = data[offset + EDIT_STRUCTURE.PLAYER_WEIGHT_OFFSET];
  const position = data[offset + EDIT_STRUCTURE.PLAYER_POSITION_OFFSET];
  
  return {
    id,
    name,
    shirtName,
    nationality,
    age,
    height,
    weight,
    position,
    offset,
    rawData: data.slice(offset, offset + EDIT_STRUCTURE.PLAYER_ENTRY_SIZE)
  };
}

function parsePlayersFromOffset(data: Uint8Array, startOffset: number, count: number): Player[] {
  const players: Player[] = [];
  const maxToRead = Math.min(count, 1000); // Limit for performance
  
  for (let i = 0; i < maxToRead; i++) {
    const offset = startOffset + (i * EDIT_STRUCTURE.PLAYER_ENTRY_SIZE);
    
    if (offset + EDIT_STRUCTURE.PLAYER_ENTRY_SIZE > data.length) break;
    
    try {
      const player = readPlayerEntry(data, offset);
      
      if (isValidPlayer(player)) {
        players.push(player);
      }
    } catch (e) {
      console.warn(`[PARSER] Error reading player ${i}:`, e);
    }
  }
  
  return players;
}

function scanForPlayerData(data: Uint8Array): Player[] {
  const players: Player[] = [];
  const view = new DataView(data.buffer);
  
  // Scan through file looking for patterns that match player entries
  // Player names are typically readable UTF-16LE strings
  
  for (let offset = 0; offset < data.length - 200; offset += 4) {
    // Look for potential player ID (reasonable range: 1 to 999999)
    const potentialId = view.getUint32(offset, true);
    
    if (potentialId > 0 && potentialId < 1000000) {
      // Check if there's a readable name at expected offset
      const nameOffset = offset + EDIT_STRUCTURE.PLAYER_NAME_OFFSET;
      
      if (nameOffset + EDIT_STRUCTURE.PLAYER_NAME_LENGTH < data.length) {
        const nameBytes = data.slice(nameOffset, nameOffset + EDIT_STRUCTURE.PLAYER_NAME_LENGTH);
        const name = decodeUTF16LE(nameBytes);
        
        // Check if name looks valid (has letters, reasonable length)
        if (isValidPlayerName(name)) {
          const player = readPlayerEntry(data, offset);
          players.push(player);
          
          // Skip ahead by entry size
          offset += EDIT_STRUCTURE.PLAYER_ENTRY_SIZE - 4;
          
          // Limit results
          if (players.length >= 500) break;
        }
      }
    }
  }
  
  return players;
}

function decodeUTF16LE(bytes: Uint8Array): string {
  try {
    // Find null terminator
    let length = bytes.length;
    for (let i = 0; i < bytes.length - 1; i += 2) {
      if (bytes[i] === 0 && bytes[i + 1] === 0) {
        length = i;
        break;
      }
    }
    
    const decoder = new TextDecoder('utf-16le');
    const decoded = decoder.decode(bytes.slice(0, length));
    return decoded.trim();
  } catch {
    // Fallback: try ASCII
    let result = '';
    for (let i = 0; i < bytes.length; i++) {
      if (bytes[i] === 0) break;
      if (bytes[i] >= 32 && bytes[i] < 127) {
        result += String.fromCharCode(bytes[i]);
      }
    }
    return result.trim();
  }
}

function isValidPlayer(player: Player): boolean {
  // Check if player data looks valid
  if (!player.name || player.name.length === 0) return false;
  if (player.id === 0 || player.id > 999999) return false;
  if (!isValidPlayerName(player.name)) return false;
  
  // Reasonable attribute ranges
  if (player.age > 0 && player.age < 15) return false;
  if (player.age > 50) return false;
  if (player.height > 0 && player.height < 140) return false;
  if (player.height > 220) return false;
  
  return true;
}

function isValidPlayerName(name: string): boolean {
  if (!name || name.length < 2) return false;
  if (name.length > 50) return false;
  
  // Should contain mostly letters
  const letterCount = (name.match(/[a-zA-Z]/g) || []).length;
  const ratio = letterCount / name.length;
  
  return ratio > 0.5;
}

function logHexDump(data: Uint8Array, start: number, length: number): void {
  for (let i = start; i < start + length && i < data.length; i += 16) {
    const hex = Array.from(data.slice(i, Math.min(i + 16, data.length)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join(' ');
    
    const ascii = Array.from(data.slice(i, Math.min(i + 16, data.length)))
      .map(b => (b >= 32 && b < 127) ? String.fromCharCode(b) : '.')
      .join('');
    
    console.log(`${i.toString(16).padStart(6, '0')}: ${hex.padEnd(48, ' ')} ${ascii}`);
  }
}

// Export for compatibility
export { parseOptionFile as parseEditFile };
