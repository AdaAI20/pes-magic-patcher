// src/lib/mt19937.ts
// Mersenne Twister PRNG implementation

export class MT19937 {
  private MT: Uint32Array;
  private index: number;

  private static readonly N = 624;
  private static readonly M = 397;
  private static readonly MATRIX_A = 0x9908B0DF;
  private static readonly UPPER_MASK = 0x80000000;
  private static readonly LOWER_MASK = 0x7FFFFFFF;

  constructor() {
    this.MT = new Uint32Array(MT19937.N);
    this.index = MT19937.N + 1;
  }

  init(seed: number): void {
    this.MT[0] = seed >>> 0;
    for (let i = 1; i < MT19937.N; i++) {
      const s = this.MT[i - 1] ^ (this.MT[i - 1] >>> 30);
      this.MT[i] = (((((s & 0xFFFF0000) >>> 16) * 1812433253) << 16) +
                   (s & 0x0000FFFF) * 1812433253 + i) >>> 0;
    }
    this.index = MT19937.N;
  }

  init_by_array(init_key: number[]): void {
    this.init(19650218);
    let i = 1;
    let j = 0;
    let k = Math.max(MT19937.N, init_key.length);

    for (; k > 0; k--) {
      const s = this.MT[i - 1] ^ (this.MT[i - 1] >>> 30);
      this.MT[i] = ((this.MT[i] ^ (((((s & 0xFFFF0000) >>> 16) * 1664525) << 16) +
                   ((s & 0x0000FFFF) * 1664525))) + init_key[j] + j) >>> 0;
      i++;
      j++;
      if (i >= MT19937.N) {
        this.MT[0] = this.MT[MT19937.N - 1];
        i = 1;
      }
      if (j >= init_key.length) {
        j = 0;
      }
    }

    for (k = MT19937.N - 1; k > 0; k--) {
      const s = this.MT[i - 1] ^ (this.MT[i - 1] >>> 30);
      this.MT[i] = ((this.MT[i] ^ (((((s & 0xFFFF0000) >>> 16) * 1566083941) << 16) +
                   (s & 0x0000FFFF) * 1566083941)) - i) >>> 0;
      i++;
      if (i >= MT19937.N) {
        this.MT[0] = this.MT[MT19937.N - 1];
        i = 1;
      }
    }

    this.MT[0] = 0x80000000;
  }

  private generateNumbers(): void {
    for (let i = 0; i < MT19937.N; i++) {
      const y = (this.MT[i] & MT19937.UPPER_MASK) | 
                (this.MT[(i + 1) % MT19937.N] & MT19937.LOWER_MASK);
      this.MT[i] = this.MT[(i + MT19937.M) % MT19937.N] ^ (y >>> 1);
      if (y & 1) {
        this.MT[i] ^= MT19937.MATRIX_A;
      }
    }
    this.index = 0;
  }

  genrand_int32(): number {
    if (this.index >= MT19937.N) {
      if (this.index > MT19937.N) {
        this.init(5489); // Default seed
      }
      this.generateNumbers();
    }

    let y = this.MT[this.index++];
    
    // Tempering
    y ^= (y >>> 11);
    y ^= ((y << 7) & 0x9D2C5680);
    y ^= ((y << 15) & 0xEFC60000);
    y ^= (y >>> 18);

    return y >>> 0;
  }

  // Generate random number in [0, 1)
  genrand_real2(): number {
    return this.genrand_int32() * (1.0 / 4294967296.0);
  }
}
