/**
 * EDIT.bin Parser for PES 2021
 * 
 * Based on Rigged Wiki documentation:
 * https://implyingrigged.info/wiki/Pro_Evolution_Soccer_2021/Edit_file
 * 
 * The decrypted EDIT file structure:
 * - Header: 0x00-0x7B (124 bytes, first 96 omitted)
 * - Player entries: 0x7C onwards, 240 (0xF0) bytes each
 * - Then player appearance, teams, managers, etc.
 */

import { decryptEditFile, isCryptoReady, DecryptedEditFile } from "./pesCrypto";

// Correct offsets from Rigged Wiki documentation
const OFFSETS = {
  HEADER: 0x00,
  HEADER_COUNTS: 0x60,  // Header count data starts at 0x60
  PLAYER_ENTRIES: 0x7C, // Player entries start at 0x7C
} as const;

// Player record size from documentation
const PLAYER_RECORD_SIZE = 0xF0; // 240 bytes per player entry

export interface Player {
  id: number;
  name: string;
  commentaryId: number;
  nationality: number;
  age: number;
  height: number;
  weight: number;
  preferredFoot: 'Right' | 'Left';
  overall: number;
  position: string;
  positionCode: number;
  
  // Stats (7-bit values, range 40-99)
  offensiveAwareness: number;
  ballControl: number;
  dribbling: number;
  tightPossession: number;
  lowPass: number;
  loftedPass: number;
  finishing: number;
  placekicking: number;
  curl: number;
  speed: number;
  acceleration: number;
  kickingPower: number;
  jump: number;
  physicalContact: number;
  balance: number;
  stamina: number;
  defensiveAwareness: number;
  ballWinning: number;
  aggression: number;
  heading: number;
  
  // GK stats
  gkAwareness: number;
  gkCatching: number;
  gkClearing: number;
  gkReflexes: number;
  gkReach: number;
  
  // Raw data for editing
  rawOffset: number;
  rawData: Uint8Array;
}

export interface Team {
  id: number;
  name: string;
  shortName: string;
  leagueId: number;
  playerIds: number[];
  rawOffset: number;
}

export interface EditBinHeader {
  playerCount: number;
  teamCount: number;
  managerCount: number;
  stadiumCount: number;
  competitionCount: number;
  unknownCount: number;
  teamPlayerTableCount: number;
  gamePlanCount: number;
}

export interface EditBinData {
  raw: Uint8Array;
  decryptedData: Uint8Array;
  fileName: string;
  fileSize: number;
  header: EditBinHeader;
  players: Player[];
  teams: Team[];
  isDecrypted: boolean;
  loadedAt: Date;
  description?: string;
  logo?: Uint8Array;
  serial?: string;
}

/**
 * Read a 7-bit value starting at a specific bit offset
 */
function read7BitValue(data: Uint8Array, byteOffset: number, bitOffset: number): number {
  const byte1 = data[byteOffset] || 0;
  const byte2 = data[byteOffset + 1] || 0;
  
  // Combine bytes and extract 7 bits starting at bitOffset
  const combined = (byte1 | (byte2 << 8));
  const value = (combined >> bitOffset) & 0x7F;
  
  return value;
}

/**
 * Read a string from the buffer (null-terminated or fixed length)
 */
function readString(data: Uint8Array, offset: number, maxLength: number): string {
  let end = offset;
  while (end < offset + maxLength && end < data.length && data[end] !== 0) {
    end++;
  }
  const bytes = data.slice(offset, end);
  try {
    return new TextDecoder('utf-8').decode(bytes);
  } catch {
    return new TextDecoder('latin1').decode(bytes);
  }
}

/**
 * Read 32-bit little-endian value
 */
function readUint32LE(data: Uint8Array, offset: number): number {
  return (data[offset] | (data[offset + 1] << 8) | 
          (data[offset + 2] << 16) | (data[offset + 3] << 24)) >>> 0;
}

/**
 * Read 16-bit little-endian value
 */
function readUint16LE(data: Uint8Array, offset: number): number {
  return (data[offset] | (data[offset + 1] << 8)) & 0xFFFF;
}

/**
 * Parse the header counts section (0x60-0x7B)
 */
function parseHeader(data: Uint8Array): EditBinHeader {
  const offset = OFFSETS.HEADER_COUNTS;
  
  return {
    playerCount: readUint16LE(data, offset),
    teamCount: readUint16LE(data, offset + 4),
    managerCount: readUint16LE(data, offset + 6),
    stadiumCount: readUint16LE(data, offset + 8),
    competitionCount: readUint16LE(data, offset + 10),
    unknownCount: readUint16LE(data, offset + 12),
    teamPlayerTableCount: readUint16LE(data, offset + 16),
    gamePlanCount: readUint16LE(data, offset + 20),
  };
}

// Position mapping from Rigged Wiki
const POSITIONS = [
  'GK', 'CB', 'LB', 'RB', 'DMF', 'CMF', 'LMF', 'RMF', 
  'AMF', 'LWF', 'RWF', 'SS', 'CF'
];

/**
 * Parse a single player entry (240 bytes)
 */
function parsePlayer(data: Uint8Array, offset: number, index: number): Player | null {
  if (offset + PLAYER_RECORD_SIZE > data.length) {
    return null;
  }
  
  const rawData = data.slice(offset, offset + PLAYER_RECORD_SIZE);
  
  // Player ID (4 bytes at 0x00)
  const id = readUint32LE(data, offset);
  
  // Skip empty or invalid entries
  if (id === 0 || id === 0xFFFFFFFF || id < 1) {
    return null;
  }
  
  // Commentary ID (4 bytes at 0x04)
  const commentaryId = readUint32LE(data, offset + 0x04);
  
  // Nationality (2 bytes at 0x08)
  const nationality = readUint16LE(data, offset + 0x08);
  
  // Height (1 byte at 0x0A)
  const height = data[offset + 0x0A] || 180;
  
  // Weight (1 byte at 0x0B)
  const weight = data[offset + 0x0B] || 75;
  
  // Stats are packed in 7-bit format
  // Offensive Awareness at 0x0E:0 (7 bits)
  const offensiveAwareness = read7BitValue(data, offset + 0x0E, 0);
  
  // Ball Control at 0x0E:7 (7 bits)
  const ballControl = read7BitValue(data, offset + 0x0E, 7);
  
  // Tight Possession at 0x10:0 (7 bits)
  const tightPossession = read7BitValue(data, offset + 0x10, 0);
  
  // Low Pass at 0x10:7 (7 bits)
  const lowPass = read7BitValue(data, offset + 0x10, 7);
  
  // Lofted Pass at 0x11:6 (7 bits)
  const loftedPass = read7BitValue(data, offset + 0x11, 6);
  
  // Finishing at 0x12:5 (7 bits)
  const finishing = read7BitValue(data, offset + 0x12, 5);
  
  // Place Kicking at 0x14:0 (7 bits)
  const placekicking = read7BitValue(data, offset + 0x14, 0);
  
  // Curl at 0x14:7 (7 bits)
  const curl = read7BitValue(data, offset + 0x14, 7);
  
  // Speed at 0x15:6 (7 bits)
  const speed = read7BitValue(data, offset + 0x15, 6);
  
  // Acceleration at 0x16:5 (7 bits)
  const acceleration = read7BitValue(data, offset + 0x16, 5);
  
  // Jump at 0x18:0 (7 bits)
  const jump = read7BitValue(data, offset + 0x18, 0);
  
  // Physical Contact at 0x18:7 (7 bits)
  const physicalContact = read7BitValue(data, offset + 0x18, 7);
  
  // Balance at 0x19:6 (7 bits)
  const balance = read7BitValue(data, offset + 0x19, 6);
  
  // Stamina at 0x1A:5 (7 bits)
  const stamina = read7BitValue(data, offset + 0x1A, 5);
  
  // Ball Winning at 0x1C:0 (7 bits)
  const ballWinning = read7BitValue(data, offset + 0x1C, 0);
  
  // Aggression at 0x1C:7 (7 bits)
  const aggression = read7BitValue(data, offset + 0x1C, 7);
  
  // GK Awareness at 0x1D:6 (7 bits)
  const gkAwareness = read7BitValue(data, offset + 0x1D, 6);
  
  // GK Catching at 0x1E:5 (7 bits)
  const gkCatching = read7BitValue(data, offset + 0x1E, 5);
  
  // Age at 0x20:7 (6 bits)
  const byte20 = data[offset + 0x20] || 0;
  const byte21 = data[offset + 0x21] || 0;
  const ageCombined = (byte20 | (byte21 << 8));
  const age = ((ageCombined >> 7) & 0x3F) || 25;
  
  // Registered Position at 0x21:5 (4 bits)
  const positionCode = ((data[offset + 0x21] || 0) >> 5) & 0x0F;
  const position = POSITIONS[positionCode] || 'CMF';
  
  // GK Reach at 0x20:0 (7 bits)
  const gkReach = read7BitValue(data, offset + 0x20, 0);
  
  // Defensive Awareness at 0x24:0 (7 bits)
  const defensiveAwareness = read7BitValue(data, offset + 0x24, 0);
  
  // GK Clearing at 0x24:7 (7 bits)
  const gkClearing = read7BitValue(data, offset + 0x24, 7);
  
  // Heading at 0x25:6 (7 bits)
  const heading = read7BitValue(data, offset + 0x25, 6);
  
  // Dribbling at 0x28:0 (7 bits)
  const dribbling = read7BitValue(data, offset + 0x28, 0);
  
  // GK Reflexes at 0x2C:6 (7 bits)
  const gkReflexes = read7BitValue(data, offset + 0x2C, 6);
  
  // Kicking Power at 0x2D:5 (7 bits)
  const kickingPower = read7BitValue(data, offset + 0x2D, 5);
  
  // Stronger Foot at 0x2F:5 (1 bit)
  const preferredFootBit = (data[offset + 0x2F] >> 5) & 1;
  const preferredFoot = preferredFootBit ? 'Left' : 'Right';
  
  // Calculate overall (average of main stats)
  const mainStats = [
    offensiveAwareness, ballControl, dribbling, tightPossession,
    lowPass, loftedPass, finishing, placekicking, curl,
    speed, acceleration, kickingPower, jump, physicalContact,
    balance, stamina, defensiveAwareness, ballWinning, aggression, heading
  ].filter(s => s >= 40 && s <= 99);
  
  const overall = mainStats.length > 0 
    ? Math.round(mainStats.reduce((a, b) => a + b, 0) / mainStats.length)
    : 75;
  
  // Player name is stored elsewhere in the appearance section or external table
  // For now, use ID-based placeholder
  const name = `Player ${id}`;
  
  return {
    id,
    name,
    commentaryId,
    nationality,
    age,
    height,
    weight,
    preferredFoot,
    overall,
    position,
    positionCode,
    offensiveAwareness,
    ballControl,
    dribbling,
    tightPossession,
    lowPass,
    loftedPass,
    finishing,
    placekicking,
    curl,
    speed,
    acceleration,
    kickingPower,
    jump,
    physicalContact,
    balance,
    stamina,
    defensiveAwareness,
    ballWinning,
    aggression,
    heading,
    gkAwareness,
    gkCatching,
    gkClearing,
    gkReflexes,
    gkReach,
    rawOffset: offset,
    rawData,
  };
}

/**
 * Parse player data from the decrypted buffer
 */
function parsePlayers(data: Uint8Array, expectedCount: number): Player[] {
  const players: Player[] = [];
  const maxPlayers = Math.min(expectedCount, 10000); // Safety limit
  
  console.log(`[EditBin Parser] Parsing up to ${maxPlayers} players from offset 0x${OFFSETS.PLAYER_ENTRIES.toString(16)}`);
  
  for (let i = 0; i < maxPlayers; i++) {
    const offset = OFFSETS.PLAYER_ENTRIES + (i * PLAYER_RECORD_SIZE);
    
    if (offset + PLAYER_RECORD_SIZE > data.length) {
      console.log(`[EditBin Parser] Reached end of data at player ${i}`);
      break;
    }
    
    const player = parsePlayer(data, offset, i);
    if (player) {
      players.push(player);
    }
  }
  
  return players;
}

/**
 * Parse team data from the decrypted buffer
 * Teams come after player entries and player appearance entries
 */
function parseTeams(data: Uint8Array, header: EditBinHeader): Team[] {
  // Team offset calculation:
  // Players: header.playerCount * 240 bytes (0xF0)
  // Player Appearances: header.playerCount * ??? bytes
  // For now, we'll search for team data or return empty array
  
  // TODO: Calculate proper team offset
  console.log(`[EditBin Parser] Team parsing not yet implemented (expected ${header.teamCount} teams)`);
  
  return [];
}

/**
 * Load and parse an EDIT.bin file
 */
export async function loadEditBin(file: File): Promise<EditBinData> {
  if (!isCryptoReady()) {
    throw new Error("Crypto module not initialized");
  }
  
  console.log(`[EditBin Parser] Loading ${file.name} (${file.size} bytes)`);
  
  const arrayBuffer = await file.arrayBuffer();
  const encrypted = new Uint8Array(arrayBuffer);
  
  // Decrypt the file
  const decryptedFile = decryptEditFile(encrypted);
  
  if (!decryptedFile) {
    throw new Error("Failed to decrypt EDIT file");
  }
  
  const decryptedData = decryptedFile.data;
  console.log(`[EditBin Parser] Decrypted data size: ${decryptedData.length} bytes`);
  
  // Parse header
  const header = parseHeader(decryptedData);
  console.log(`[EditBin Parser] Header: ${header.playerCount} players, ${header.teamCount} teams`);
  
  // Parse players
  const players = parsePlayers(decryptedData, header.playerCount);
  console.log(`[EditBin Parser] Parsed ${players.length} valid players`);
  
  // Parse teams
  const teams = parseTeams(decryptedData, header);
  
  // Try to decode description
  let description: string | undefined;
  try {
    description = new TextDecoder('utf-16le').decode(decryptedFile.description);
  } catch {
    description = undefined;
  }
  
  // Try to decode serial
  let serial: string | undefined;
  try {
    serial = new TextDecoder('utf-16le').decode(decryptedFile.serial);
  } catch {
    serial = undefined;
  }
  
  return {
    raw: encrypted,
    decryptedData,
    fileName: file.name,
    fileSize: file.size,
    header,
    players,
    teams,
    isDecrypted: true,
    loadedAt: new Date(),
    description,
    logo: decryptedFile.logo,
    serial,
  };
}

/**
 * Export EDIT.bin data back to file format
 */
export function exportEditBin(data: EditBinData): Blob {
  // For export, we would encrypt the data back
  // TODO: Implement encryption
  return new Blob([new Uint8Array(data.raw).buffer.slice(0)], { type: "application/octet-stream" });
}

/**
 * Update a player in the raw data
 */
export function updatePlayer(data: EditBinData, playerId: number, updates: Partial<Player>): EditBinData {
  const player = data.players.find(p => p.id === playerId);
  if (!player) {
    throw new Error(`Player ${playerId} not found`);
  }
  
  // Create a copy of the decrypted data
  const newDecrypted = new Uint8Array(data.decryptedData);
  
  // TODO: Implement individual field updates with proper bit manipulation
  
  // Update the player in the array
  const updatedPlayers = data.players.map(p => 
    p.id === playerId ? { ...p, ...updates } : p
  );
  
  return {
    ...data,
    decryptedData: newDecrypted,
    players: updatedPlayers,
  };
}
