// src/parsers/editBinParser.ts
// PES 2021 EDIT file parser - Complete version with proper attribute parsing

import { decryptEditBin, initCrypto } from '../crypto/pesCrypto';

// File structure constants
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
  foot: number;
  ovr: number;
  teamId: number;
  offset: number;
}

export interface Team {
  id: number;
  name: string;
  shortName: string;
  league: string;
  country: string;
  stadium: string;
  playerCount: number;
  rating: number;
  color: string;
  offset: number;
}

export interface League {
  id: number;
  name: string;
  country: string;
  teams: number;
  tier: number;
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
  teams: Team[];
  leagues: League[];
}

// Known leagues to search for
const KNOWN_LEAGUES = [
  { name: 'Premier League', country: 'England', tier: 1 },
  { name: 'EFL Championship', country: 'England', tier: 2 },
  { name: 'Championship', country: 'England', tier: 2 },
  { name: 'La Liga', country: 'Spain', tier: 1 },
  { name: 'La Liga 2', country: 'Spain', tier: 2 },
  { name: 'Bundesliga', country: 'Germany', tier: 1 },
  { name: 'Bundesliga 2', country: 'Germany', tier: 2 },
  { name: 'Serie A', country: 'Italy', tier: 1 },
  { name: 'Serie B', country: 'Italy', tier: 2 },
  { name: 'Ligue 1', country: 'France', tier: 1 },
  { name: 'Ligue 2', country: 'France', tier: 2 },
  { name: 'Eredivisie', country: 'Netherlands', tier: 1 },
  { name: 'Liga Portugal', country: 'Portugal', tier: 1 },
  { name: 'Primeira Liga', country: 'Portugal', tier: 1 },
  { name: 'Scottish Premiership', country: 'Scotland', tier: 1 },
  { name: 'Super Lig', country: 'Turkey', tier: 1 },
  { name: 'Russian Premier', country: 'Russia', tier: 1 },
  { name: 'Liga MX', country: 'Mexico', tier: 1 },
  { name: 'MLS', country: 'USA', tier: 1 },
  { name: 'J1 League', country: 'Japan', tier: 1 },
  { name: 'K League', country: 'South Korea', tier: 1 },
  { name: 'A-League', country: 'Australia', tier: 1 },
  { name: 'Champions League', country: 'Europe', tier: 0 },
  { name: 'Europa League', country: 'Europe', tier: 0 },
  { name: 'Copa Libertadores', country: 'South America', tier: 0 },
  { name: 'AFC Champions', country: 'Asia', tier: 0 },
  { name: 'World Cup', country: 'World', tier: 0 },
  { name: 'Euro', country: 'Europe', tier: 0 },
];

// Known stadiums to exclude from team detection
const STADIUMS = [
  'stamford bridge', 'anfield', 'old trafford', 'etihad', 'emirates',
  'camp nou', 'bernabeu', 'san siro', 'allianz arena', 'allianz stadium',
  'parc des princes', 'wembley', 'elland road', 'london stadium', 'villa park',
  'goodison park', 'tottenham', 'king power', 'st james', 'signal iduna',
  'westfalenstadion', 'olympiastadion', 'velodrome', 'maracana', 'azteca',
  'la bombonera', 'monumental', 'mestalla', 'vicente calderon', 'wanda',
];

// Position codes
const POSITION_NAMES: Record<number, string> = {
  0: 'GK', 1: 'CB', 2: 'LB', 3: 'RB', 4: 'DMF', 5: 'CMF',
  6: 'LMF', 7: 'RMF', 8: 'AMF', 9: 'LWF', 10: 'RWF', 11: 'SS', 12: 'CF',
  13: 'LWF', 14: 'RWF', 15: 'CF'
};

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
  console.log('[PARSER] Team count (header):', teamCount);

  const header: EditBinHeader = {
    magic: version,
    version: version,
    fileSize: dataSize,
    playerCount: playerCountFromHeader,
    teamCount: teamCount,
  };

  // Parse all data
  const players = parsePlayersComplete(data, view, headerSize, playerCountFromHeader);
  console.log('[PARSER] ✅ Loaded', players.length, 'players');

  const teams = parseTeamsComplete(data, view);
  console.log('[PARSER] ✅ Loaded', teams.length, 'teams');

  const leagues = parseLeaguesComplete(data);
  console.log('[PARSER] ✅ Loaded', leagues.length, 'leagues');
  
  return { header, raw: decryptedBuffer, players, teams, leagues };
}

function parsePlayersComplete(
  data: Uint8Array,
  view: DataView,
  headerSize: number,
  expectedCount: number
): Player[] {
  const players: Player[] = [];
  const seenNames = new Set<string>();
  
  const entryStart = headerSize > 0 && headerSize < 500 ? headerSize : HEADER_SIZE;
  const maxPlayers = Math.min(expectedCount || 15000, 15000);
  
  console.log('[PARSER] Parsing players from offset:', entryStart);

  for (let i = 0; i < maxPlayers; i++) {
    const entryOffset = entryStart + (i * PLAYER_ENTRY_SIZE);
    
    if (entryOffset + PLAYER_ENTRY_SIZE > data.length) break;
    
    // Read name at fixed offset within entry
    const nameOffset = entryOffset + NAME_OFFSET_IN_ENTRY;
    const name = readAsciiString(data, nameOffset, 46);
    
    if (!name || name.length < 2) continue;
    if (!isValidPlayerName(name)) continue;
    if (seenNames.has(name)) continue;
    
    seenNames.add(name);
    
    // Read player ID
    let id = view.getUint32(entryOffset, true);
    if (id === 0 || id > 0xFFFFFF) {
      id = players.length + 1;
    }
    
    // Read shirt name (typically after player name)
    const shirtOffset = nameOffset + 50;
    let shirtName = readAsciiString(data, shirtOffset, 18);
    if (!shirtName || !/^[A-Z]/.test(shirtName)) {
      shirtName = name.split(' ').pop() || name; // Use surname as shirt name
    }

    // Try multiple known offsets for attributes
    // PES player entries have attributes at various locations
    let age = 0, height = 0, weight = 0, position = 0, ovr = 0, nationality = 0, foot = 0;
    
    // Common attribute offsets in PES 2021 (relative to entry start)
    const attrOffsets = [
      { age: 40, height: 41, weight: 42, pos: 44, ovr: 48, nation: 50 },
      { age: 56, height: 57, weight: 58, pos: 60, ovr: 64, nation: 66 },
      { age: 160, height: 161, weight: 162, pos: 163, ovr: 164, nation: 166 },
      { age: 200, height: 201, weight: 202, pos: 203, ovr: 204, nation: 206 },
    ];
    
    for (const offsets of attrOffsets) {
      const tryAge = data[entryOffset + offsets.age];
      const tryHeight = data[entryOffset + offsets.height];
      const tryWeight = data[entryOffset + offsets.weight];
      const tryPos = data[entryOffset + offsets.pos];
      
      // Validate: age 15-50, height 150-210, weight 50-120
      if (tryAge >= 15 && tryAge <= 50 && 
          tryHeight >= 150 && tryHeight <= 210 && 
          tryWeight >= 50 && tryWeight <= 120) {
        age = tryAge;
        height = tryHeight;
        weight = tryWeight;
        position = tryPos < 16 ? tryPos : 0;
        ovr = data[entryOffset + offsets.ovr];
        nationality = view.getUint16(entryOffset + offsets.nation, true);
        break;
      }
    }
    
    // If still no attributes, try to find them by scanning
    if (age === 0) {
      for (let j = 0; j < 250; j++) {
        const tryAge = data[entryOffset + j];
        if (tryAge >= 16 && tryAge <= 45) {
          const nextByte = data[entryOffset + j + 1];
          const nextNext = data[entryOffset + j + 2];
          // Check if next bytes could be height and weight
          if (nextByte >= 155 && nextByte <= 205 && nextNext >= 55 && nextNext <= 110) {
            age = tryAge;
            height = nextByte;
            weight = nextNext;
            position = data[entryOffset + j + 3] % 16;
            break;
          }
        }
      }
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
      foot: foot,
      ovr: ovr,
      teamId: 0,
      offset: entryOffset
    });
    
    if (players.length <= 10) {
      console.log(`[PARSER] Player ${players.length}: "${name}" Age:${age} H:${height} W:${weight} Pos:${POSITION_NAMES[position] || position}`);
    }
  }
  
  return players;
}

function parseTeamsComplete(data: Uint8Array, view: DataView): Team[] {
  const teams: Team[] = [];
  const seenNames = new Set<string>();
  
  console.log('[PARSER] Searching for teams...');
  
  // Known team prefixes/suffixes
  const teamPatterns = [
    /^FC [A-Z]/,
    /^CF [A-Z]/,
    /^SC [A-Z]/,
    /^AC [A-Z]/,
    /^AS [A-Z]/,
    /^SS [A-Z]/,
    /^US [A-Z]/,
    /^Real [A-Z]/,
    /^Inter [A-Z]/,
    /^Sporting [A-Z]/,
    /^Athletic [A-Z]/,
    /^Atletico [A-Z]/,
    / FC$/,
    / CF$/,
    / SC$/,
    / United$/,
    / City$/,
    / Town$/,
    / Rovers$/,
    / Wanderers$/,
  ];
  
  for (let i = 0; i < data.length - 50 && teams.length < 1000; i++) {
    if (data[i] >= 65 && data[i] <= 90) { // Start with uppercase
      const name = readAsciiString(data, i, 50);
      
      if (name.length >= 4 && !seenNames.has(name)) {
        // Check if it's a stadium (exclude)
        const nameLower = name.toLowerCase();
        const isStadium = STADIUMS.some(s => nameLower.includes(s));
        
        if (!isStadium && isRealTeamName(name, teamPatterns)) {
          seenNames.add(name);
          
          teams.push({
            id: teams.length + 1,
            name: name,
            shortName: getShortName(name),
            league: '',
            country: guessCountry(name),
            stadium: '',
            playerCount: 25, // Default squad size
            rating: 3,
            color: getTeamColor(name),
            offset: i
          });
          
          if (teams.length <= 10) {
            console.log(`[PARSER] Team ${teams.length}: "${name}"`);
          }
          
          i += name.length + 100;
        }
      }
    }
  }
  
  return teams;
}

function parseLeaguesComplete(data: Uint8Array): League[] {
  const leagues: League[] = [];
  
  console.log('[PARSER] Searching for leagues...');
  
  for (const league of KNOWN_LEAGUES) {
    const offset = findStringInData(data, league.name);
    if (offset >= 0) {
      leagues.push({
        id: leagues.length + 1,
        name: league.name,
        country: league.country,
        teams: 20,
        tier: league.tier,
        offset: offset
      });
      console.log(`[PARSER] League found: "${league.name}" at offset 0x${offset.toString(16)}`);
    }
  }
  
  return leagues;
}

// Helper functions

function readAsciiString(data: Uint8Array, offset: number, maxLen: number): string {
  let result = '';
  for (let i = 0; i < maxLen && offset + i < data.length; i++) {
    const c = data[offset + i];
    if (c === 0) break;
    if ((c >= 65 && c <= 90) || (c >= 97 && c <= 122) || 
        c === 32 || c === 46 || c === 39 || c === 45 ||
        (c >= 48 && c <= 57)) {
      result += String.fromCharCode(c);
    } else {
      break;
    }
  }
  return result.trim();
}

function isValidPlayerName(name: string): boolean {
  if (!name || name.length < 2 || name.length > 35) return false;
  if (!/^[A-Z]/.test(name)) return false;
  
  // Must have at least 2 letters
  const letters = name.match(/[A-Za-z]/g);
  if (!letters || letters.length < 2) return false;
  
  // Common player name patterns
  if (/^[A-Z]\. [A-Z]/.test(name)) return true; // "L. MESSI"
  if (/^[A-Z][A-Z]+$/.test(name) && name.length >= 3) return true; // "RONALDO"
  if (/^[A-Z][a-z]+ [A-Z]/.test(name)) return true; // "Lionel Messi"
  if (/^[A-Z][A-Z\s'.]+[A-Z]$/.test(name)) return true;
  
  return false;
}

function isRealTeamName(name: string, patterns: RegExp[]): boolean {
  if (!name || name.length < 4 || name.length > 40) return false;
  
  // Must start with uppercase
  if (!/^[A-Z]/.test(name)) return false;
  
  // Check against known patterns
  for (const pattern of patterns) {
    if (pattern.test(name)) return true;
  }
  
  // Additional checks
  if (/^[A-Z][a-z]+( [A-Z][a-z]+)+$/.test(name) && name.length >= 10) return true;
  
  return false;
}

function getShortName(name: string): string {
  // Get 3-letter abbreviation
  const words = name.split(' ');
  if (words.length >= 2) {
    return (words[0][0] + words[1][0] + (words[2]?.[0] || words[1][1] || '')).toUpperCase();
  }
  return name.slice(0, 3).toUpperCase();
}

function guessCountry(name: string): string {
  const nameLower = name.toLowerCase();
  if (nameLower.includes('united') || nameLower.includes('city') || nameLower.includes('rovers')) return 'England';
  if (nameLower.includes('real') || nameLower.includes('atletico')) return 'Spain';
  if (nameLower.includes('fc bayern') || nameLower.includes('borussia')) return 'Germany';
  if (nameLower.includes('inter') || nameLower.includes('milan') || nameLower.includes('juventus')) return 'Italy';
  if (nameLower.includes('paris') || nameLower.includes('olympique')) return 'France';
  return '';
}

function getTeamColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 70%, 40%)`;
}

function findStringInData(data: Uint8Array, searchStr: string): number {
  const searchBytes = new TextEncoder().encode(searchStr);
  
  outer:
  for (let i = 0; i < data.length - searchBytes.length; i++) {
    for (let j = 0; j < searchBytes.length; j++) {
      if (data[i + j] !== searchBytes[j]) {
        continue outer;
      }
    }
    return i;
  }
  return -1;
}

export async function exportEditBin(data: EditBinData, filename?: string): Promise<void> {
  if (!data || !data.raw) throw new Error('No EDIT data to export');

  const blob = new Blob([data.raw], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'EDIT00000000';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function parseEditBin(file: File) {
  return loadEditBin(file);
}
