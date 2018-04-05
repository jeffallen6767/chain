// keccak sha-256 via opencl v1.0.0
// copyright (c) 2018 Jeffrey David Allen

#define KECCAK_ROUNDS 24
#define ROWS_X 5
#define COLS_Y 5
#define UINT32_IN_UINT64 2
#define UINT32_OFFSET_Y 10
#define BITS_IN_UINT32 32

#define ASCII_DOUBLE_QUOTE 0x22
#define ASCII_CLOSING_BRACE 0x7d

#define SHA_PAD_FIRST_BYTE 0x06
#define SHA_PAD_LAST_BYTE 0x80

#define WORKSIZE {{num_threads}}

#define RESULT_SLOTS {{result_slots}}

// ROT64 by this number
__constant uchar CONST_RHO[25] = {
  0, 1, 62, 28, 27,  // y=0, x=0..4
  36, 44, 6, 55, 20, // y=1, x=0..4
  3, 10, 43, 25, 39, // y=2, x=0..4
  41, 45, 15, 21, 8, // y=3, x=0..4
  18, 2, 61, 56, 14  // y=4, x=0..4
};

// move to new x,y
__constant uchar CONST_PI[50] = {
  0,1, 20,21, 40,41, 10,11, 30,31, // y=0, x=0..4
  32,33, 2,3, 22,23, 42,43, 12,13, // y=1, x=0..4
  14,15, 34,35, 4,5, 24,25, 44,45, // y=2, x=0..4
  46,47, 16,17, 36,37, 6,7, 26,27, // y=3, x=0..4
  28,29, 48,49, 18,19, 38,39, 8,9  // y=4, x=0..4
};

// The uInt64 round constants (uInt32Lo, uInt32Hi)
__constant uint2 CONST_IOTA[24] = {
  (uint2)(0x00000001,0x00000000), // 0x0000000000000001
  (uint2)(0x00008082,0x00000000), // 0x0000000000008082
  (uint2)(0x0000808a,0x80000000), // 0x800000000000808A
  (uint2)(0x80008000,0x80000000), // 0x8000000080008000
  (uint2)(0x0000808b,0x00000000), // 0x000000000000808B
  (uint2)(0x80000001,0x00000000), // 0x0000000080000001
  (uint2)(0x80008081,0x80000000), // 0x8000000080008081
  (uint2)(0x00008009,0x80000000), // 0x8000000000008009
  (uint2)(0x0000008a,0x00000000), // 0x000000000000008A
  (uint2)(0x00000088,0x00000000), // 0x0000000000000088
  (uint2)(0x80008009,0x00000000), // 0x0000000080008009
  (uint2)(0x8000000a,0x00000000), // 0x000000008000000A
  (uint2)(0x8000808b,0x00000000), // 0x000000008000808B
  (uint2)(0x0000008b,0x80000000), // 0x800000000000008B
  (uint2)(0x00008089,0x80000000), // 0x8000000000008089
  (uint2)(0x00008003,0x80000000), // 0x8000000000008003
  (uint2)(0x00008002,0x80000000), // 0x8000000000008002
  (uint2)(0x00000080,0x80000000), // 0x8000000000000080
  (uint2)(0x0000800a,0x00000000), // 0x000000000000800A
  (uint2)(0x8000000a,0x80000000), // 0x800000008000000A
  (uint2)(0x80008081,0x80000000), // 0x8000000080008081
  (uint2)(0x00008080,0x80000000), // 0x8000000000008080
  (uint2)(0x80000001,0x00000000), // 0x0000000080000001
  (uint2)(0x80008008,0x80000000)  // 0x8000000080008008
};

// bitwise-rotate-left rot positions a uInt64 as uInt32Lo, uInt32Hi
uint2 ROTL64(uint lo, uint hi, const uchar rot) {
  // if zero, just return copy of input
  if (rot < 1) {
    return (uint2)(lo, hi);
  }

  // if rot >= 32 switch lo and hi bytes, and rotate mod 32
  uchar which = rot < BITS_IN_UINT32 ? 1 : 0;
  uchar one = which ? rot : rot - BITS_IN_UINT32;
  uchar two = BITS_IN_UINT32 - one;
  uint tmp;
  
  if (!which) {
    tmp = lo;
    lo = hi;
    hi = tmp;
  }
  
  //return [lo << one | hi >>> two, hi << one | lo >>> two];
  return (uint2)(lo << one | hi >> two, hi << one | lo >> two);
}

// the permutation function
uint* keccak_uInt32LowHigh(uint* A) {

  // temp modified copy of A ( rho step )
  uint B[50];
  // temp modified copy of B ( pi step )
  uint E[50];
  // int32Lo = index 0
  uchar lo = 0;
  // int32Hi = index 1
  uchar hi = 1;
  // main permutation round counter
  uchar i;
  // temp values and references
  uint k,p,q,r,s,t,u,v,w,x,y,z;
  // more temp 
  uint2 F;
  
  for (i=0; i<KECCAK_ROUNDS; i++) {

    // θ (theta) step, see: http://keccak.noekeon.org/Keccak-f-Theta.pdf
    for (x=0; x<ROWS_X; x++) {
      z = x * UINT32_IN_UINT64;
      w = z + 1;
      // low
      B[z] = A[z] ^ A[z+10] ^ A[z+20] ^ A[z+30] ^ A[z+40];
      // high
      B[w] = A[w] ^ A[w+10] ^ A[w+20] ^ A[w+30] ^ A[w+40];
    }
    for (x=0; x<ROWS_X; x++) {
      /*
      x=0,w=4,z=1
      x=1,w=0,z=2
      x=2,w=1,z=3
      x=3,w=2,z=4
      x=4,w=3,z=0
      */
      w = ((x + 4) % ROWS_X) * 2;
      z = ((x + 1) % ROWS_X) * 2;
      F = ROTL64(B[z], B[z+1], 1);
      r = B[w] ^ F.x;// low
      p = B[w+1] ^ F.y;// high
      s = x * UINT32_IN_UINT64;
      for (y=0; y<COLS_Y; y++) {
        q = s + y * UINT32_OFFSET_Y;
        // low
        A[q] ^= r;
        // high
        A[q+1] ^= p;
      }
    }
    
    // ρ (rho) step, see: http://keccak.noekeon.org/Keccak-f-Rho.pdf
    for (y=0; y<COLS_Y; y++) {
      p = y * UINT32_OFFSET_Y; // column
      for (x=0; x<ROWS_X; x++) {
        q = p + (x * UINT32_IN_UINT64); // low
        r = q + 1; // high
        s = A[q];
        t = A[r];
        u = y * ROWS_X;
        v = u + x;
        w = CONST_RHO[v];
        F = ROTL64(s, t, w);
        // low
        B[q] = F.x >> 0;
        // high
        B[r] = F.y >> 0;
      }
    }
    
    // π (pi) step, see: http://keccak.noekeon.org/Keccak-f-Pi.pdf
    for (y=0; y<COLS_Y; y++) {
      p = y * UINT32_OFFSET_Y;
      for (x=0; x<ROWS_X; x++) {
        q = p + (x * UINT32_IN_UINT64);
        r = q + 1;
        s = CONST_PI[q];
        t = s + 1;
        // low
        E[s] = B[q];
        // high
        E[t] = B[r];
      }
    }
    
    // χ (chi) step, see: http://keccak.noekeon.org/Keccak-f-Chi.pdf
    for (y=0; y<COLS_Y; y++) {
      p = y * UINT32_OFFSET_Y; // column
      for (x=0; x<ROWS_X; x++) {
        r = p + (x * UINT32_IN_UINT64);
        s = p + (((x + 1) % ROWS_X) * UINT32_IN_UINT64);
        t = p + (((x + 2) % ROWS_X) * UINT32_IN_UINT64);
        u = r + 1;
        v = s + 1;
        w = t + 1;
        // low
        A[r] = E[r] ^ ((~E[s]) & E[t]);
        // high
        A[u] = E[u] ^ ((~E[v]) & E[w]);
      }
    }
    
    // ι (iota) step
    F = CONST_IOTA[i];
    // low
    A[0] ^= F.x;
    // high
    A[1] ^= F.y;
  }
  return A;
}

/*__attribute__((reqd_work_group_size(WORKSIZE, 1, 1)))*/
__kernel void search(
  __global uint*restrict outUints,
  __global const uchar*restrict inBytes,
  const uint nextByteIndex,
  const uchar difficulty,
  const uint baseNonce
  )
{
  uint id = get_global_id(0);
  
  uint nonce = id + baseNonce;
  
  const char hex[] = "0123456789abcdef";
  uchar pattern[10] = {
    hex[(nonce >> 28) & 0xf], 
    hex[(nonce >> 24) & 0xf], 
    hex[(nonce >> 20) & 0xf], 
    hex[(nonce >> 16) & 0xf],
    hex[(nonce >> 12) & 0xf],
    hex[(nonce >> 8) & 0xf],
    hex[(nonce >> 4) & 0xf],
    hex[(nonce >> 0) & 0xf],
    ASCII_DOUBLE_QUOTE,
    ASCII_CLOSING_BRACE
  };
  
  uchar data[200] = {};
  uint* u = (uint*)&data;
  
  uint w = 0;
  uint x = 0;
  uint y = 0;
  int z = nextByteIndex;
  uchar max = difficulty + 1;
  uchar rsiz = 136; // 200 - 64
  uchar result = 1;
  
  // init data
  for (x=0; x<200; x++) {
    data[x] = inBytes[x];
  }
  
  // add pattern:
  for (x=0; x<10; x++) {
    data[z++] ^= pattern[x];
    if (z >= rsiz) {
      // apply permutation function
      keccak_uInt32LowHigh(u);
      // reset current index
      z = 0;
    }
  }

  // set first pad byte
  data[z] ^= SHA_PAD_FIRST_BYTE;
  // set last pad byte
  data[rsiz - 1] ^= SHA_PAD_LAST_BYTE;
  
  // apply permutation function
  keccak_uInt32LowHigh(u);
  
  // start with one, since 0 difficulty is instant win
  for(x=1; x<max; x++) {
    if (x % 2) {
      // odd
      y = (x - 1) / 2;
      if (data[y] > 0x0f) {
        result = 0;
        break;
      }
    } else {
      // even
      y = (x - 2) / 2;
      if (data[y] > 0x00) {
        result = 0;
        break;
      }
    }
  }
  
  if (result) {
    x = id * RESULT_SLOTS;
    outUints[x++] = nonce;
    for (y=0; y<8; y++) {
      outUints[x+y] = u[y];
    }
  }
}
