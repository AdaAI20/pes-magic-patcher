import { create } from "zustand";

export interface EditBinHeader {
  magic: number;
  fileSize: number;
  playerCount: number;
  teamCount: number;
  playerOffset: number;
  teamOffset: number;
  leagueOffset: number;
}

export interface ParsedPlayer {
  index: number; // TEMP: index only (real fields later)
  offset: number;
}

interface EditBinState {
  loaded: boolean;
  rawBuffer: ArrayBuffer | null;
  header: EditBinHeader | null;
  players: ParsedPlayer[];

  setEditBin: (payload: {
    raw: ArrayBuffer;
    header: EditBinHeader;
  }) => void;

  clear: () => void;
}

export const useEditBinStore = create<EditBinState>((set) => ({
  loaded: false,
  rawBuffer: null,
  header: null,
  players: [],

  setEditBin: ({ raw, header }) => {
    // TEMP player table scan (safe, non-destructive)
    const players: ParsedPlayer[] = [];

    const PLAYER_RECORD_SIZE = 0x100; // placeholder, adjusted later

    for (let i = 0; i < header.playerCount; i++) {
      players.push({
        index: i,
        offset: header.playerOffset + i * PLAYER_RECORD_SIZE,
      });
    }

    set({
      loaded: true,
      rawBuffer: raw,
      header,
      players,
    });
  },

  clear: () =>
    set({
      loaded: false,
      rawBuffer: null,
      header: null,
      players: [],
    }),
}));
