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
  // General State
  isCryptoReady: boolean;
  
  // EditBin State
  editBin: EditData | null;
  
  // Actions
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
    try {
      console.log("[FileStore] Initializing Crypto...");
      await initCrypto();
      set({ isCryptoReady: true });
      console.log("[FileStore] Crypto initialized");
    } catch (e) {
      console.error("[FileStore] Crypto failed to initialize", e);
    }
  },

  importFile: async (file: File, type: FileType) => {
    // Ensure crypto is ready before processing any binary files
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
        // Placeholder for future CPK logic
        console.warn("[FileStore] CPK detected but parser not implemented");
        throw new Error("CPK parsing not yet implemented");

      case "TED":
        console.warn("[FileStore] TED detected but parser not implemented");
        throw new Error("TED parsing not yet implemented");

      case "DAT":
        console.warn("[FileStore] DAT detected but parser not implemented");
        throw new Error("DAT parsing not yet implemented");

      case "UNKNOWN":
      default:
        throw new Error(`Unknown file type: ${file.name}`);
    }
  },

  clearEditBin: () => set({ editBin: null }),
}));
