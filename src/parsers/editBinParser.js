import { decryptEditBin, encryptEditBin } from "../crypto/pesCrypto";

/* -------------------------------------------------- */
/* Low-level helpers */
/* -------------------------------------------------- */

function u32(view, offset) {
  return view.getUint32(offset, true);
}

function u16(view, offset) {
  return view.getUint16(offset, true);
}

function u8(view, offset) {
  return view.getUint8(offset);
}

/* -------------------------------------------------- */
/* Load + decrypt EDIT00000000 */
/* -------------------------------------------------- */

export async function loadEditBin(file) {
  const encrypted = await file.arrayBuffer();
  const decrypted = decryptEditBin(encrypted);
  const view = new DataView(decrypted);

  /* -------------------------------------------------- */
  /* Header */
  /* -------------------------------------------------- */

  const header = {
    magic: u32(view, 0x00),
    fileSize: u32(view, 0x04),
    playerCount: u32(view, 0x08),
    teamCount: u32(view, 0x0c),
    playerOffset: u32(view, 0x10),
    teamOffset: u32(view, 0x14),
    leagueOffset: u32(view, 0x18)
  };

  if (header.magic === 0 || header.playerOffset === 0) {
    throw new Error("Invalid EDIT00000000");
  }

  /* -------------------------------------------------- */
  /* Parsed containers (EMPTY FOR NOW) */
  /* -------------------------------------------------- */

  const players = [];
  const teams = [];
  const leagues = [];

  /* -------------------------------------------------- */
  /* TODO (NEXT STEPS):
   * - parsePlayers(view, header)
   * - parseTeams(view, header)
   * - parseNames(view)
   * -------------------------------------------------- */

  return {
    header,
    players,
    teams,
    leagues,
    raw: decrypted
  };
}

/* -------------------------------------------------- */
/* Encrypt + export */
/* -------------------------------------------------- */

export function exportEditBin(rawBuffer) {
  const encrypted = encryptEditBin(rawBuffer);

  // IMPORTANT: no extension
  return new Blob([encrypted], {
    type: "application/octet-stream"
  });
}
