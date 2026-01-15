import { Blowfish } from "./blowfish";
import { PES_EDIT_KEY } from "./keys";

export function decryptEditBin(buffer) {
  const bf = new Blowfish(PES_EDIT_KEY);
  const out = new Uint8Array(buffer.length);

  for (let i = 0; i < buffer.length; i += 8) {
    const l =
      (buffer[i] << 24) |
      (buffer[i + 1] << 16) |
      (buffer[i + 2] << 8) |
      buffer[i + 3];

    const r =
      (buffer[i + 4] << 24) |
      (buffer[i + 5] << 16) |
      (buffer[i + 6] << 8) |
      buffer[i + 7];

    const [dl, dr] = bf.decryptBlock(l, r);

    out[i] = (dl >>> 24) & 0xff;
    out[i + 1] = (dl >>> 16) & 0xff;
    out[i + 2] = (dl >>> 8) & 0xff;
    out[i + 3] = dl & 0xff;

    out[i + 4] = (dr >>> 24) & 0xff;
    out[i + 5] = (dr >>> 16) & 0xff;
    out[i + 6] = (dr >>> 8) & 0xff;
    out[i + 7] = dr & 0xff;
  }

  return out;
}
