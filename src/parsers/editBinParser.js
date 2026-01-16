import { decryptEditBin, encryptEditBin } from "../crypto/pesCrypto";

function readU32(view, offset) {
  return view.getUint32(offset, true);
}

export async function loadEditBin(file) {
  const encrypted = await file.arrayBuffer();
  const decrypted = decryptEditBin(encrypted);

  const view = new DataView(decrypted);

  // Basic validation
  const magic = readU32(view, 0x00);
  if (magic === 0) {
    throw new Error("Invalid EDIT.BIN (bad magic)");
  }

  const header = {
    magic,
    fileSize: readU32(view, 0x04),
    playerCount: readU32(view, 0x08),
    teamCount: readU32(view, 0x0C),
    playerOffset: readU32(view, 0x10),
    teamOffset: readU32(view, 0x14),
    leagueOffset: readU32(view, 0x18)
  };

  return {
    header,
    raw: decrypted
  };
}

export function exportEditBin(rawBuffer) {
  const encrypted = encryptEditBin(rawBuffer);
  return new Blob([encrypted], { type: "application/octet-stream" });
}
