// src/parsers/editBinParser.ts
// PES 2021 EDIT file parser - Players, Teams, Leagues

import { decryptEditBin, initCrypto } from '../crypto/pesCrypto';

// File structure constants
const HEADER_SIZE = 80;
const PLAYER_ENTRY_SIZE = 312;
const NAME_OFFSET_IN_ENTRY = 98;
const TEAM_ENTRY_SIZE = 456;

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

  // Parse players
  const players = parsePlayersFromEditBin(data, view, headerSize, playerCountFromHeader);
  console.log('[PARSER] ✅ Loaded', players.length, 'players');

  // Parse teams
  const teams = parseTeamsFromEditBin(data, view, players);
  console.log('[PARSER] ✅ Loaded', teams.length, 'teams');

  // Parse leagues
  const leagues = parseLeaguesFromEditBin(data, view);
  console.log('[PARSER] ✅ Loaded', leagues.length, 'leagues');
  
  return {
    header,
    raw: decryptedBuffer,
    players,
    teams,
    leagues
  };
}

function parsePlayersFromEditBin(
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
    
    const nameOffset = entryOffset + NAME_OFFSET_IN_ENTRY;
    const name = readAsciiString(data, nameOffset, 46);
    
    if (!name || name.length < 3) continue;
    if (!isValidPlayerName(name)) continue;
    if (seenNames.has(name)) continue;
    
    seenNames.add(name);
    
    let id = 0;
    try {
      id = view.getUint32(entryOffset, true);
      if (id === 0 || id > 0xFFFFFF) {
        id = players.length + 1;
      }
    } catch {
      id = players.length + 1;
    }
    
    let shirtName = '';
    const shirtOffset = nameOffset + 50;
    if (shirtOffset + 18 < data.length) {
      const possibleShirt = readAsciiString(data, shirtOffset, 18);
      if (isShirtName(possibleShirt)) {
        shirtName = possibleShirt;
      }
    }

    // Try to read attributes
    let age = 0, height = 0, weight = 0, position = 0, nationality = 0;
    try {
      // Attributes are typically stored after the names
      const attrOffset = entryOffset + 200;
      if (attrOffset + 10 < data.length) {
        const ageVal = data[attrOffset];
        const heightVal = data[attrOffset + 1];
        const weightVal = data[attrOffset + 2];
        
        if (ageVal > 15 && ageVal < 50) age = ageVal;
        if (heightVal > 150 && heightVal < 210) height = heightVal;
        if (weightVal > 50 && weightVal < 120) weight = weightVal;
      }
    } catch {}
    
    players.push({
      id,
      name,
      shirtName,
      nationality,
      age,
      height,
      weight,
      position,
      offset: entryOffset
    });
    
    if (players.length <= 10) {
      console.log(`[PARSER] Player ${players.length}: "${name}" (ID: ${id})`);
    }
  }
  
  return players;
}

function parseTeamsFromEditBin(
  data: Uint8Array,
  view: DataView,
  players: Player[]
): Team[] {
  const teams: Team[] = [];
  const seenNames = new Set<string>();
  
  // Teams are typically stored after players
  // Search for team names in the file
  console.log('[PARSER] Searching for teams...');
  
  // Team name patterns to look for
  const teamPatterns = [
    /^FC [A-Z]/,
    /^[A-Z][a-z]+ (FC|CF|SC|AC)$/,
    /^(Real|Inter|AC|AS|SS|US) [A-Z]/,
    /^[A-Z][a-z]+ (United|City|Town|Athletic|Rovers|Wanderers)$/,
  ];
  
  // Scan for potential team entries
  // Look for ASCII strings that look like team names
  for (let i = 0; i < data.length - 50 && teams.length < 1000; i++) {
    // Look for uppercase letter start
    if (data[i] >= 65 && data[i] <= 90) {
      const name = readAsciiString(data, i, 50);
      
      if (name.length >= 4 && isTeamName(name) && !seenNames.has(name)) {
        seenNames.add(name);
        
        // Extract team info
        teams.push({
          id: teams.length + 1,
          name: name,
          shortName: name.slice(0, 3).toUpperCase(),
          league: '',
          country: '',
          stadium: '',
          playerCount: 0,
          rating: 3,
          color: getTeamColor(name),
          offset: i
        });
        
        if (teams.length <= 10) {
          console.log(`[PARSER] Team ${teams.length}: "${name}"`);
        }
        
        i += name.length + 100; // Skip ahead
      }
    }
  }
  
  return teams;
}

function parseLeaguesFromEditBin(
  data: Uint8Array,
  view: DataView
): League[] {
  const leagues: League[] = [];
  const knownLeagues = [
    'Premier League', 'La Liga', 'Bundesliga', 'Serie A', 'Ligue 1',
    'Eredivisie', 'Liga Portugal', 'Scottish Premiership',
    'Championship', 'Serie B', 'La Liga 2', 'Bundesliga 2',
    'Champions League', 'Europa League', 'Copa Libertadores'
  ];
  
  console.log('[PARSER] Searching for leagues...');
  
  // Search for known league names
  for (const leagueName of knownLeagues) {
    const found = findStringInData(data, leagueName);
    if (found >= 0) {
      leagues.push({
        id: leagues.length + 1,
        name: leagueName,
        country: getLeagueCountry(leagueName),
        teams: 20,
        tier: leagueName.includes('2') || leagueName.includes('B') ? 2 : 1,
        offset: found
      });
      console.log(`[PARSER] League found: "${leagueName}" at offset 0x${found.toString(16)}`);
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
        (c >= 48 && c <= 57)) { // Also allow digits
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
  if (/^[A-Z]\. [A-Z][A-Z]+/.test(name)) return true;
  if (/^[A-Z]\. [A-Z][a-z]+/.test(name)) return true;
  if (/^[A-Z][A-Z\s'.]+[A-Z]$/.test(name) && name.length >= 4) return true;
  if (/^[A-Z][a-z]+ [A-Z][a-z]+/.test(name)) return true;
  if (/^(De|Van|Von|Le|La|Di|Da|O')[A-Z\s]/.test(name)) return true;
  return false;
}

function isShirtName(name: string): boolean {
  if (!name || name.length < 3 || name.length > 18) return false;
  return /^[A-Z][A-Z\s'.]+$/.test(name);
}

function isTeamName(name: string): boolean {
  if (!name || name.length < 4 || name.length > 40) return false;
  if (!/^[A-Z]/.test(name)) return false;
  
  // Common team name patterns
  if (/^FC [A-Z]/.test(name)) return true;
  if (/^[A-Z][a-z]+ FC$/.test(name)) return true;
  if (/^(Real|Inter|AC|AS|SS|US|FK|SK|BV|SV|SC|CF|CD) /.test(name)) return true;
  if (/ (United|City|Town|Athletic|Rovers|Wanderers|FC|CF|SC)$/.test(name)) return true;
  if (/^[A-Z][a-z]+( [A-Z][a-z]+)+$/.test(name) && name.length >= 8) return true;
  
  return false;
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

function getTeamColor(name: string): string {
  // Generate a consistent color based on team name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return `hsl(${h}, 70%, 40%)`;
}

function getLeagueCountry(leagueName: string): string {
  const countries: Record<string, string> = {
    'Premier League': 'England',
    'Championship': 'England',
    'La Liga': 'Spain',
    'La Liga 2': 'Spain',
    'Bundesliga': 'Germany',
    'Bundesliga 2': 'Germany',
    'Serie A': 'Italy',
    'Serie B': 'Italy',
    'Ligue 1': 'France',
    'Eredivisie': 'Netherlands',
    'Liga Portugal': 'Portugal',
    'Scottish Premiership': 'Scotland',
    'Champions League': 'Europe',
    'Europa League': 'Europe',
    'Copa Libertadores': 'South America',
  };
  return countries[leagueName] || 'Unknown';
}

// Export function
export async function exportEditBin(
  data: EditBinData,
  filename?: string
): Promise<void> {
  console.log('[EXPORT] Preparing to export EDIT file...');
  
  if (!data || !data.raw) {
    console.error('[EXPORT] No data to export');
    throw new Error('No EDIT data to export');
  }

  const blob = new Blob([data.raw], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'EDIT00000000';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  URL.revokeObjectURL(url);
  
  console.log('[EXPORT] ✅ File exported:', filename || 'EDIT00000000');
}

export async function parseEditBin(file: File) {
  return loadEditBin(file);
}
