import { create } from "zustand";
import { loadEditBin } from "@/parsers/editBinParser";

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

interface EditBinState {
  loaded: boolean;
  header: EditBinHeader | null;
  rawBuffer: ArrayBuffer | null;

  loadFromFile: (file: File) => Promise<void>;
  reset: () => void;
}

/* ------------------------------- STORE ---------------------------------- */

export const useEditBinStore = create<EditBinState>((set) => ({
  loaded: false,
  header: null,
  rawBuffer: null,

  async loadFromFile(file) {
    const result = await loadEditBin(file);

    set({
      loaded: true,
      header: result.header,
      rawBuffer: result.raw,
    });
  },

  reset() {
    set({
      loaded: false,
      header: null,
      rawBuffer: null,
    });
  },
}));
