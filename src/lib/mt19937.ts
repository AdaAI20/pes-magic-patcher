/**
 * Mersenne Twister MT19937
 * 
 * A TypeScript port of the MT19937 random number generator.
 * Original C implementation by Takuji Nishimura and Makoto Matsumoto.
 * 
 * This is used by the PES EDIT file decryption algorithm.
 */

// Period parameters
const N = 624;
const M = 397;
const MATRIX_A = 0x9908b0df >>> 0;   // constant vector a
const UPPER_MASK = 0x80000000 >>> 0; // most significant w-r bits
const LOWER_MASK = 0x7fffffff >>> 0; // least significant r bits

export class MT19937 {
  private mt: Uint32Array;
  private mti: number;

  constructor() {
    this.mt = new Uint32Array(N);
    this.mti = N + 1; // mti==N+1 means mt[N] is not initialized
  }

  /**
   * Initializes mt[N] with a seed
   */
  initGenrand(s: number): void {
    this.mt[0] = s >>> 0;
    for (this.mti = 1; this.mti < N; this.mti++) {
      // mt[mti] = (1812433253 * (mt[mti-1] ^ (mt[mti-1] >> 30)) + mti)
      const prev = this.mt[this.mti - 1];
      this.mt[this.mti] = (Math.imul(1812433253, (prev ^ (prev >>> 30))) + this.mti) >>> 0;
    }
  }

  /**
   * Initialize by an array with array-length
   * init_key is the array for initializing keys
   * key_length is its length
   */
  initByArray(initKey: Uint32Array): void {
    const keyLength = initKey.length;
    this.initGenrand(19650218);
    
    let i = 1;
    let j = 0;
    let k = N > keyLength ? N : keyLength;
    
    for (; k; k--) {
      const prev = this.mt[i - 1];
      // mt[i] = (mt[i] ^ ((mt[i-1] ^ (mt[i-1] >> 30)) * 1664525)) + init_key[j] + j
      this.mt[i] = ((this.mt[i] ^ Math.imul((prev ^ (prev >>> 30)), 1664525)) + initKey[j] + j) >>> 0;
      i++;
      j++;
      if (i >= N) {
        this.mt[0] = this.mt[N - 1];
        i = 1;
      }
      if (j >= keyLength) {
        j = 0;
      }
    }
    
    for (k = N - 1; k; k--) {
      const prev = this.mt[i - 1];
      // mt[i] = (mt[i] ^ ((mt[i-1] ^ (mt[i-1] >> 30)) * 1566083941)) - i
      this.mt[i] = ((this.mt[i] ^ Math.imul((prev ^ (prev >>> 30)), 1566083941)) - i) >>> 0;
      i++;
      if (i >= N) {
        this.mt[0] = this.mt[N - 1];
        i = 1;
      }
    }
    
    this.mt[0] = 0x80000000 >>> 0; // MSB is 1; assuring non-zero initial array
  }

  /**
   * Generates a random number on [0,0xffffffff]-interval
   */
  genrandInt32(): number {
    let y: number;
    const mag01 = [0x0, MATRIX_A];

    if (this.mti >= N) {
      // Generate N words at one time
      let kk: number;

      if (this.mti === N + 1) {
        // If initGenrand() has not been called, a default initial seed is used
        this.initGenrand(5489);
      }

      for (kk = 0; kk < N - M; kk++) {
        y = ((this.mt[kk] & UPPER_MASK) | (this.mt[kk + 1] & LOWER_MASK)) >>> 0;
        this.mt[kk] = (this.mt[kk + M] ^ (y >>> 1) ^ mag01[y & 0x1]) >>> 0;
      }
      for (; kk < N - 1; kk++) {
        y = ((this.mt[kk] & UPPER_MASK) | (this.mt[kk + 1] & LOWER_MASK)) >>> 0;
        this.mt[kk] = (this.mt[kk + (M - N)] ^ (y >>> 1) ^ mag01[y & 0x1]) >>> 0;
      }
      y = ((this.mt[N - 1] & UPPER_MASK) | (this.mt[0] & LOWER_MASK)) >>> 0;
      this.mt[N - 1] = (this.mt[M - 1] ^ (y >>> 1) ^ mag01[y & 0x1]) >>> 0;

      this.mti = 0;
    }

    y = this.mt[this.mti++];

    // Tempering
    y ^= y >>> 11;
    y ^= (y << 7) & 0x9d2c5680;
    y ^= (y << 15) & 0xefc60000;
    y ^= y >>> 18;

    return y >>> 0;
  }
}
