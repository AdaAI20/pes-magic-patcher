// src/store/editBinStore.ts
import { create } from 'zustand';

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

interface EditBinStore {
  data: EditBinData | null;
  isLoaded: boolean;
  fileName: string | null;
  loadEditBin: (data: EditBinData, fileName?: string) => void;
  clearData: () => void;
  getPlayers: () => Player[];
  getTeams: () => Team[];
  getLeagues: () => League[];
  updatePlayer: (id: number, updates: Partial<Player>) => void;
  updateTeam: (id: number, updates: Partial<Team>) => void;
}

export const useEditBinStore = create<EditBinStore>((set, get) => ({
  data: null,
  isLoaded: false,
  fileName: null,

  loadEditBin: (data: EditBinData, fileName?: string) => {
    console.log('[STORE] Saving state:', data.players.length, 'players,', data.teams.length, 'teams.');
    
    // Also save to localStorage for persistence
    try {
      const toSave = {
        header: data.header,
        players: data.players,
        teams: data.teams,
        leagues: data.leagues,
        fileName: fileName || null,
      };
      localStorage.setItem('pes-edit-data', JSON.stringify(toSave));
    } catch (e) {
      console.warn('[STORE] Could not save to localStorage:', e);
    }
    
    set({ 
      data, 
      isLoaded: true,
      fileName: fileName || null 
    });
  },

  clearData: () => {
    localStorage.removeItem('pes-edit-data');
    set({ data: null, isLoaded: false, fileName: null });
  },

  getPlayers: () => {
    const state = get();
    if (state.data?.players) return state.data.players;
    
    // Try to load from localStorage
    try {
      const saved = localStorage.getItem('pes-edit-data');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.players || [];
      }
    } catch (e) {
      console.warn('[STORE] Could not load from localStorage');
    }
    return [];
  },

  getTeams: () => {
    const state = get();
    if (state.data?.teams) return state.data.teams;
    
    try {
      const saved = localStorage.getItem('pes-edit-data');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.teams || [];
      }
    } catch (e) {}
    return [];
  },

  getLeagues: () => {
    const state = get();
    if (state.data?.leagues) return state.data.leagues;
    
    try {
      const saved = localStorage.getItem('pes-edit-data');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.leagues || [];
      }
    } catch (e) {}
    return [];
  },

  updatePlayer: (id: number, updates: Partial<Player>) => {
    const state = get();
    if (!state.data) return;
    
    const players = state.data.players.map(p => 
      p.id === id ? { ...p, ...updates } : p
    );
    
    set({
      data: { ...state.data, players }
    });
  },

  updateTeam: (id: number, updates: Partial<Team>) => {
    const state = get();
    if (!state.data) return;
    
    const teams = state.data.teams.map(t => 
      t.id === id ? { ...t, ...updates } : t
    );
    
    set({
      data: { ...state.data, teams }
    });
  },
}));

// Initialize from localStorage on app load
if (typeof window !== 'undefined') {
  try {
    const saved = localStorage.getItem('pes-edit-data');
    if (saved) {
      const parsed = JSON.parse(saved);
      console.log('[STORE] Restoring from localStorage:', parsed.players?.length, 'players');
      useEditBinStore.setState({
        data: {
          header: parsed.header,
          raw: new ArrayBuffer(0), // Can't restore raw buffer from localStorage
          players: parsed.players || [],
          teams: parsed.teams || [],
          leagues: parsed.leagues || [],
        },
        isLoaded: true,
        fileName: parsed.fileName,
      });
    }
  } catch (e) {
    console.warn('[STORE] Could not restore from localStorage');
  }
}
