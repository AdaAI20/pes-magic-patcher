import { create } from "zustand";
import { produce } from "immer";

/* ------------------------------------------------------------------ */
/* TYPES */
/* ------------------------------------------------------------------ */

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
  /** true when EDIT00000000 is successfully loaded */
  loaded: boolean;

  rawBuffer: ArrayBuffer | null;
  header: EditBinHeader | null;

  players: Player[];

  /** ACTIONS */
  loadEditBin: (data: {
    header: EditBinHeader;
    raw: ArrayBuffer;
  }) => void;

  clear: () => void;
}

/* ------------------------------------------------------------------ */
/* PLAYER PARSER (FOUNDATION — SAFE & MINIMAL) */
/* ------------------------------------------------------------------ */
/**
 * ⚠️ This is intentionally SIMPLE.
 * It only proves:
 * - EDIT00000000 decrypted correctly
 * - playerOffset is valid
 * - Zustand receives real data
 */

function parsePlayers(
  buffer: ArrayBuffer,
  header: EditBinHeader
): Player[] {
  const view = new DataView(buffer);
  const players: Player[] = [];

  const BASE = header.playerOffset;
  const STRIDE = 0x80; // placeholder (safe minimum)
  const MAX = Math.min(header.playerCount, 200);

  console.log("[STORE] Parsing players", {
    base: BASE,
    stride: STRIDE,
    count: MAX,
    bufferSize: buffer.byteLength,
  });

  for (let i = 0; i < MAX; i++) {
    const offset = BASE + i * STRIDE;

    if (offset + STRIDE > buffer.byteLength) {
      console.warn("[STORE] Player offset out of bounds", offset);
      break;
    }

    const id = view.getUint32(offset + 0x00, true);
    const teamId = view.getUint16(offset + 0x10, true);
    const overall = view.getUint8(offset + 0x20);
    const posRaw = view.getUint8(offset + 0x21);

    players.push({
      id,
      name: `Player ${id}`, // real name decoding later
      teamId,
      overall,
      position: decodePosition(posRaw),
    });
  }

  console.log("[STORE] Players parsed:", players.length);

  return players;
}

/* ------------------------------------------------------------------ */
/* POSITION DECODER (TEMP) */
/* ------------------------------------------------------------------ */

function decodePosition(value: number): string {
  const map: Record<number, string> = {
    0x00: "GK",
    0x01: "CB",
    0x02: "LB",
    0x03: "RB",
    0x04: "DMF",
    0x05: "CMF",
    0x06: "AMF",
    0x07: "LWF",
    0x08: "RWF",
    0x09: "SS",
    0x0a: "CF",
  };

  return map[value] ?? "UNK";
}

/* ------------------------------------------------------------------ */
/* ZUSTAND STORE (FINAL, EXPLICIT, DEBUGGED) */
/* ------------------------------------------------------------------ */

export const useEditBinStore = create<EditBinState>()((set, get) => ({
  loaded: false,

  rawBuffer: null,
  header: null,
  players: [],

  loadEditBin: ({ header, raw }) =>
    set(
      produce((state: EditBinState) => {
        console.log("[STORE] loadEditBin CALLED");
        console.log("[STORE] Header:", header);
        console.log("[STORE] Raw size:", raw.byteLength);

        state.loaded = true;
        state.header = header;
        state.rawBuffer = raw;
        state.players = parsePlayers(raw, header);

        console.log("[STORE] State after load:", {
          loaded: state.loaded,
          players: state.players.length,
        });
      })
    ),

  clear: () => {
    console.log("[STORE] CLEAR");
    set({
      loaded: false,
      rawBuffer: null,
      header: null,
      players: [],
    });
  },
}));

/* ------------------------------------------------------------------ */
/* 🔥 HARD GLOBAL DEBUG (TEMP — VERY IMPORTANT) */
/* ------------------------------------------------------------------ */

/**
 * This lets us inspect the store from the browser console:
 * window.__EDIT_STORE__.getState()
 */
if (typeof window !== "undefined") {
  (window as any).__EDIT_STORE__ = useEditBinStore;
  console.log("[STORE] Debug hook installed: window.__EDIT_STORE__");
}
