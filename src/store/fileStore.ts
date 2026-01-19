import { create } from "zustand";
import { initCrypto } from "@/crypto/pesCrypto";
import { loadEditBin } from "@/parsers/editBinParser";

/* -------------------------------- TYPES -------------------------------- */

export type FileType = "BIN" | "CPK" | "TED" | "DAT" | "UNKNOWN";

export interface EditData {
  header: any;
  players: any[];
  teams: any[];
  raw: ArrayBuffer;
}

interface FileStoreState {
  isCryptoReady: boolean;
  editBin: EditData | null;
  
  initialize: () => Promise<void>;
  importFile: (file: File, type: FileType) => Promise<void>;
  clearEditBin: () => void;
}

/* -------------------------------- STORE -------------------------------- */

export const useFileStore = create<FileStoreState>((set, get) => ({
  isCryptoReady: false,
  editBin: null,

  initialize: async () => {
    if (get().isCryptoReady) return;
    
    console.log("[FileStore] Initializing Crypto...");
    try {
      // We explicitly await here. If pesCrypto hangs, this line hangs.
      // The fix in pesCrypto.ts ensures this resolves immediately.
      await initCrypto();
      set({ isCryptoReady: true });
      console.log("[FileStore] Crypto initialized");
    } catch (e) {
      console.error("[FileStore] Crypto failed to initialize", e);
      // RE-THROW the error so importFile knows to stop the spinner
      throw e; 
    }
  },

  importFile: async (file: File, type: FileType) => {
    // 1. Initialize first. If this fails, the error bubbles up to the UI
    await get().initialize();

    switch (type) {
      case "BIN":
        console.log("[FileStore] Parsing BIN file...");
        try {
          const data = await loadEditBin(file);
          set({ editBin: data });
          console.log("[FileStore] BIN loaded successfully", data.header);
        } catch (error) {
          console.error("[FileStore] Error parsing BIN:", error);
          throw error;
        }
        break;

      case "CPK":
        throw new Error("CPK parsing not yet implemented");

      case "TED":
        throw new Error("TED parsing not yet implemented");

      case "DAT":
        throw new Error("DAT parsing not yet implemented");

      case "UNKNOWN":
      default:
        throw new Error(`Unknown file type: ${file.name}`);
    }
  },

  clearEditBin: () => set({ editBin: null }),
}));
