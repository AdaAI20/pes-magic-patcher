// Minimal Blowfish implementation for PES edit.bin

const P_INIT = [
  0x243f6a88, 0x85a308d3, 0x13198a2e, 0x03707344,
  0xa4093822, 0x299f31d0, 0x082efa98, 0xec4e6c89,
  0x452821e6, 0x38d01377, 0xbe5466cf, 0x34e90c6c,
  0xc0ac29b7, 0xc97c50dd, 0x3f84d5b5, 0xb5470917,
  0x9216d5d9, 0x8979fb1b
];

// NOTE: S-boxes omitted here for brevity explanation
// In next step, I will paste FULL S-boxes (they are large)

export class Blowfish {
  private P = [...P_INIT];

  constructor(private key: Uint8Array) {
    this.keySchedule();
  }

  private keySchedule() {
    let j = 0;
    for (let i = 0; i < this.P.length; i++) {
      let data = 0;
      for (let k = 0; k < 4; k++) {
        data = (data << 8) | this.key[j];
        j = (j + 1) % this.key.length;
      }
      this.P[i] ^= data;
    }
  }

  decryptBlock(l: number, r: number): [number, number] {
    for (let i = 17; i > 1; i--) {
      l ^= this.P[i];
      [l, r] = [r, l];
    }
    [l, r] = [r, l];
    r ^= this.P[1];
    l ^= this.P[0];
    return [l >>> 0, r >>> 0];
  }
}
