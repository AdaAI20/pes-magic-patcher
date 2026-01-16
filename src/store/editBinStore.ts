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

  /* actions */
  loadEditBin: (data: {
    header: EditBinHeader;
    raw: ArrayBuffer;
  }) => void;

  clear: () => void;
}

/* ------------------------------------------------------------------ */
/* BASIC PLAYER PARSER (FOUNDATION) */
/* ------------------------------------------------------------------ */

function parsePlayers(
  buffer: ArrayBuffer,
  header: EditBinHeader
): Player[] {
  const view = new DataView(buffer);
  const players: Player[] = [];

  const BASE = header.playerOffset;
  const STRIDE = 0x80; // temporary
  const count = Math.min(header.playerCount, 200);

  for (let i = 0; i < count; i++) {
    const offset = BASE + i * STRIDE;
    if (offset + STRIDE > buffer.byteLength) break;

    const id = view.getUint32(offset + 0x00, true);
    const teamId = view.getUint16(offset + 0x10, true);
    const overall = view.getUint8(offset + 0x20);
    const posRaw = view.getUint8(offset + 0x21);

    players.push({
      id,
      name: `Player ${id}`,
      teamId,
      overall,
      position: decodePosition(posRaw),
    });
  }

  return players;
}

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
/* ZUSTAND STORE */
/* ------------------------------------------------------------------ */

export const useEditBinStore = create<EditBinState>()((set) => ({
  loaded: false,
  rawBuffer: null,
  header: null,
  players: [],

  loadEditBin: ({ header, raw }) =>
    set(
      produce((state: EditBinState) => {
        state.loaded = true;
        state.header = header;
        state.rawBuffer = raw;
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
