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
  loaded: boolean;

  rawBuffer: ArrayBuffer | null;
  header: EditBinHeader | null;
  players: Player[];

  loadEditBin: (data: {
    raw: ArrayBuffer;
    header: EditBinHeader;
  }) => void;

  clear: () => void;
}

/* ------------------------------------------------------------------ */
/* BASIC PLAYER PARSER (TEMP) */
/* ------------------------------------------------------------------ */

function parsePlayers(
  buffer: ArrayBuffer,
  header: EditBinHeader
): Player[] {
  const view = new DataView(buffer);
  const players: Player[] = [];

  const BASE = header.playerOffset;
  const STRIDE = 0x80;
  const count = Math.min(header.playerCount, 200);

  for (let i = 0; i < count; i++) {
    const offset = BASE + i * STRIDE;
    if (offset + STRIDE > buffer.byteLength) break;

    players.push({
      id: view.getUint32(offset, true),
      name: `Player ${i + 1}`,
      teamId: view.getUint16(offset + 0x10, true),
      overall: view.getUint8(offset + 0x20),
      position: "UNK",
    });
  }

  return players;
}

/* ------------------------------------------------------------------ */
/* STORE */
/* ------------------------------------------------------------------ */

export const useEditBinStore = create<EditBinState>()((set) => ({
  loaded: false,
  rawBuffer: null,
  header: null,
  players: [],

  loadEditBin: ({ raw, header }) =>
    set(
      produce((state: EditBinState) => {
        state.loaded = true;
        state.rawBuffer = raw;
        state.header = header;
        state.players = parsePlayers(raw, header);
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
