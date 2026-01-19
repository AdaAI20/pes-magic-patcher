import { create } from "zustand";
import { produce } from "immer";

/* -------------------------------- TYPES -------------------------------- */

export interface EditBinHeader {
  magic: number;
  fileSize: number;
  playerCount: number;
  teamCount: number;
  playerOffset: number;
  teamOffset: number;
  leagueOffset: number;
}

export interface Player {
  id: number;
  name: string;
  teamId: number;
  overall: number;
  position: string;
}

interface EditBinState {
  loaded: boolean;
  rawBuffer: ArrayBuffer | null;
  header: EditBinHeader | null;
  players: Player[];

  // UPDATED: Now accepts players array directly
  loadEditBin: (data: {
    header: EditBinHeader;
    raw: ArrayBuffer;
    players: Player[];
  }) => void;

  clear: () => void;
}

/* -------------------------------- ZUSTAND STORE -------------------------------- */

export const useEditBinStore = create<EditBinState>()((set) => ({
  loaded: false,
  rawBuffer: null,
  header: null,
  players: [],

  loadEditBin: ({ header, raw, players }) =>
    set(
      produce((state: EditBinState) => {
        console.log("[STORE] Updating state...", { 
          loaded: true, 
          playerCount: players.length 
        });

        state.loaded = true;
        state.header = header;
        state.rawBuffer = raw;
        state.players = players;
      })
    ),

  clear: () =>
    set({
      loaded: false,
      rawBuffer: null,
      header: null,
      players: [],
    }),
}));

/* -------------------------------- DEBUGGING -------------------------------- */
if (typeof window !== "undefined") {
  (window as any).__EDIT_STORE__ = useEditBinStore;
}
