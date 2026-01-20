// PES 2021 EDIT file parser - Working version with 312-byte entries

import { decryptEditBin, initCrypto } from '../crypto/pesCrypto';

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
  console.log('[PARSER] === UPDATED PARSER v2 ===');
  console.log('[PARSER] Parsing:', file.name);
  
  await initCrypto();
  
  const buffer = await file.arrayBuffer();
  const decryptedBuffer = decryptEditBin(buffer);
  const data = new Uint8Array(decryptedBuffer);
  const view = new DataView(decryptedBuffer);
  
  console.log('[PARSER] File size:', data.length);

  const version = view.getUint32(0, true);
  const headerSize = view.getUint32(4, true);
  const dataSize = view.getUint32(8, true);
  const playerCountHeader = view.getUint32(12, true);
  
  console.log('[PARSER] Version:', version);
  console.log('[PARSER] Header size:', headerSize);
  console.log('[PARSER] Player count (header):', playerCountHeader);

  if (version > 100 || headerSize === 0 || headerSize > 500) {
    console.log('[PARSER] Invalid header');
    return { players: [], teams: [], version: 0, playerCount: 0 };
  }

  const players = extractAllPlayers(data, view, headerSize, playerCountHeader);
  
  console.log('[PARSER] ✅ Loaded', players.length, 'players');
  
  return { players, teams: [], version, playerCount: players.length };
}

function extractAllPlayers(
  data: Uint8Array,
  view: DataView,
  headerSize: number,
  expectedCount: number
): Player[] {
  const players: Player[] = [];
  const seenNames = new Set<string>();
  
  console.log('[PARSER] Using entry size:', PLAYER_ENTRY_SIZE);
  console.log('[PARSER] Name offset:', NAME_OFFSET_IN_ENTRY);

  const maxPlayers = Math.min(expectedCount, 15000);

  for (let i = 0; i < maxPlayers; i++) {
    const entryOffset = headerSize + (i * PLAYER_ENTRY_SIZE);
    
    if (entryOffset + PLAYER_ENTRY_SIZE > data.length) break;
    
    const nameOffset = entryOffset + NAME_OFFSET_IN_ENTRY;
    const name = readName(data, nameOffset, 46);
    
    if (!name || name.length < 3) continue;
    if (!isValidName(name)) continue;
    if (seenNames.has(name)) continue;
    
    seenNames.add(name);
    
    let id = view.getUint32(entryOffset, true);
    if (id === 0 || id > 0xFFFFFF) id = players.length + 1;
    
    const shirtOffset = nameOffset + 50;
    let shirtName = '';
    if (shirtOffset + 18 < data.length) {
      const s = readName(data, shirtOffset, 18);
      if (s && /^[A-Z][A-Z\s'.]+$/.test(s)) shirtName = s;
    }
    
    players.push({
      id, name, shirtName,
      nationality: 0, age: 0, height: 0, weight: 0, position: 0,
      offset: entryOffset
    });
    
    if (players.length <= 5) {
      console.log(`[PARSER] Player ${players.length}: "${name}"`);
    }
  }
  
  return players;
}

function readName(data: Uint8Array, offset: number, maxLen: number): string {
  let result = '';
  for (let i = 0; i < maxLen && offset + i < data.length; i++) {
    const c = data[offset + i];
    if (c === 0) break;
    if ((c >= 65 && c <= 90) || (c >= 97 && c <= 122) || 
        c === 32 || c === 46 || c === 39 || c === 45) {
      result += String.fromCharCode(c);
    } else break;
  }
  return result.trim();
}

function isValidName(name: string): boolean {
  if (!name || name.length < 3 || name.length > 35) return false;
  if (!/^[A-Z]/.test(name)) return false;
  if (/^[A-Z]\. [A-Z][A-Z]+/.test(name)) return true;
  if (/^[A-Z]\. [A-Z][a-z]+/.test(name)) return true;
  if (/^[A-Z][A-Z\s'.]+[A-Z]$/.test(name)) return true;
  if (/^[A-Z][a-z]+ [A-Z][a-z]+/.test(name)) return true;
  return false;
}

export { parseOptionFile as parseEditFile };
