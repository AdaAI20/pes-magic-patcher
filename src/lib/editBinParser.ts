/**
 * EDIT.bin Parser for PES 2021
 * 
 * Based on 4ccEditor specifications:
 * - Players start at offset 0x2000
 * - Teams start at offset 0x8000
 * 
 * This parser handles EDIT00000000 files (option files / save data)
 */

import { decryptBuffer, isCryptoReady } from "./pesCrypto";

// Known offsets from 4ccEditor
const OFFSETS = {
  HEADER: 0x0,
  PLAYERS: 0x2000,
  TEAMS: 0x8000,
  COMPETITIONS: 0x10000,
} as const;

// Player record size (approximate from 4ccEditor)
const PLAYER_RECORD_SIZE = 0x70; // 112 bytes per player

export interface Player {
  id: number;
  name: string;
  nationality: number;
  age: number;
  height: number;
  weight: number;
  preferredFoot: number;
  overall: number;
  position: string;
  // Raw data for editing
  rawOffset: number;
}

export interface Team {
  id: number;
  name: string;
  shortName: string;
  leagueId: number;
  playerIds: number[];
  rawOffset: number;
}

export interface EditBinData {
  raw: Uint8Array;
  fileName: string;
  fileSize: number;
  players: Player[];
  teams: Team[];
  isDecrypted: boolean;
  loadedAt: Date;
}

/**
 * Parse player data from the decrypted buffer
 */
function parsePlayers(data: Uint8Array, maxPlayers: number = 100): Player[] {
  const players: Player[] = [];
  const playersOffset = OFFSETS.PLAYERS;
  
  for (let i = 0; i < maxPlayers; i++) {
    const offset = playersOffset + (i * PLAYER_RECORD_SIZE);
    
    if (offset + PLAYER_RECORD_SIZE > data.length) break;
    
    // Read player ID (first 4 bytes, little-endian)
    const id = data[offset] | (data[offset + 1] << 8) | 
               (data[offset + 2] << 16) | (data[offset + 3] << 24);
    
    // Skip empty slots
    if (id === 0 || id === 0xFFFFFFFF) continue;
    
    // Read name (offset +4, 46 bytes, null-terminated UTF-8)
    let nameEnd = offset + 4;
    while (nameEnd < offset + 50 && data[nameEnd] !== 0) nameEnd++;
    const nameBytes = data.slice(offset + 4, nameEnd);
    const name = new TextDecoder('utf-8').decode(nameBytes) || `Player_${id}`;
    
    // Read basic stats (approximate offsets based on 4ccEditor)
    const nationality = data[offset + 52] || 0;
    const age = data[offset + 53] || 20;
    const height = data[offset + 54] || 175;
    const weight = data[offset + 55] || 70;
    const preferredFoot = data[offset + 56] || 0;
    const overall = data[offset + 60] || 70;
    
    // Position lookup
    const positionCode = data[offset + 57] || 0;
    const positions = ['GK', 'CB', 'LB', 'RB', 'DMF', 'CMF', 'LMF', 'RMF', 'AMF', 'LWF', 'RWF', 'SS', 'CF'];
    const position = positions[positionCode] || 'CMF';
    
    players.push({
      id,
      name,
      nationality,
      age,
      height,
      weight,
      preferredFoot,
      overall,
      position,
      rawOffset: offset,
    });
  }
  
  return players;
}

/**
 * Parse team data from the decrypted buffer
 */
function parseTeams(data: Uint8Array, maxTeams: number = 50): Team[] {
  const teams: Team[] = [];
  const teamsOffset = OFFSETS.TEAMS;
  const teamRecordSize = 0x100; // 256 bytes per team (approximate)
  
  for (let i = 0; i < maxTeams; i++) {
    const offset = teamsOffset + (i * teamRecordSize);
    
    if (offset + teamRecordSize > data.length) break;
    
    // Read team ID
    const id = data[offset] | (data[offset + 1] << 8);
    
    // Skip empty slots
    if (id === 0 || id === 0xFFFF) continue;
    
    // Read team name (offset +4, 50 bytes)
    let nameEnd = offset + 4;
    while (nameEnd < offset + 54 && data[nameEnd] !== 0) nameEnd++;
    const nameBytes = data.slice(offset + 4, nameEnd);
    const name = new TextDecoder('utf-8').decode(nameBytes) || `Team_${id}`;
    
    // Read short name (offset +56, 8 bytes)
    let shortEnd = offset + 56;
    while (shortEnd < offset + 64 && data[shortEnd] !== 0) shortEnd++;
    const shortBytes = data.slice(offset + 56, shortEnd);
    const shortName = new TextDecoder('utf-8').decode(shortBytes) || name.substring(0, 3).toUpperCase();
    
    const leagueId = data[offset + 2] || 0;
    
    // Player IDs would be at offset +64 onwards (32 players * 4 bytes each)
    const playerIds: number[] = [];
    for (let j = 0; j < 32; j++) {
      const pidOffset = offset + 64 + (j * 4);
      if (pidOffset + 4 <= data.length) {
        const pid = data[pidOffset] | (data[pidOffset + 1] << 8) |
                    (data[pidOffset + 2] << 16) | (data[pidOffset + 3] << 24);
        if (pid > 0 && pid < 0xFFFFFFFF) {
          playerIds.push(pid);
        }
      }
    }
    
    teams.push({
      id,
      name,
      shortName,
      leagueId,
      playerIds,
      rawOffset: offset,
    });
  }
  
  return teams;
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
  const decrypted = decryptBuffer(encrypted);
  
  // Parse the data
  const players = parsePlayers(decrypted, 1000);
  const teams = parseTeams(decrypted, 100);
  
  console.log(`[EditBin Parser] Parsed ${players.length} players, ${teams.length} teams`);
  
  return {
    raw: decrypted,
    fileName: file.name,
    fileSize: file.size,
    players,
    teams,
    isDecrypted: true,
    loadedAt: new Date(),
  };
}

/**
 * Export EDIT.bin data back to file format
 */
export function exportEditBin(data: EditBinData): Blob {
  // For export, we would encrypt the data back
  // For now, just return the raw data as a blob
  // Use slice() to create a regular ArrayBuffer from the Uint8Array
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
  
  // Create a copy of the raw data
  const newRaw = new Uint8Array(data.raw);
  
  // Apply updates to raw data at the player's offset
  // TODO: Implement individual field updates
  
  // Update the player in the array
  const updatedPlayers = data.players.map(p => 
    p.id === playerId ? { ...p, ...updates } : p
  );
  
  return {
    ...data,
    raw: newRaw,
    players: updatedPlayers,
  };
}
