/**
 * Multiply two unsigned 32-bit numbers and take the upper 32-bits of the result.
 *  
 * The result of multiplication is a 64-bits number and we are only interested in the part that lands in the upper 32-bits.
 * For example if we multiply `0xffffffff * 0xffffffff`, we get:
 
 * |   32-bits  |   32-bits  |
 * +------------+------------+
 * |    upper   |    lower   |
 * | 0xfffffffe | 0x00000001 |
 *
 * So `0xfffffffe` is returned.
 */
export function mulUpperUnsigned(a: u32, b: u32): u32 {
  const aHigh = a >> 16;
  const aLow = a & 0xffff;
  const bHigh = b >> 16;
  const bLow = b & 0xffff;

  const lowLow = aLow * bLow;
  const lowHigh = aLow * bHigh;
  const highLow = aHigh * bLow;
  const highHigh = aHigh * bHigh;
  const carry = (lowLow >> 16) + (lowHigh & 0xffff) + (highLow & 0xffff);

  return highHigh + (lowLow >> 16) + (highLow >> 16) + (carry >> 16);
}

/**
 * Same as [mulUpperUnsigned] but treat the arguments as signed (two-complement) 32-bit numbers and the result alike.
 */
export function mulUpperSigned(a: i32, b: i32): i32 {
  const sign = Math.sign(a) * Math.sign(b);
  const aAbs = a < 0 ? ~a + 1 : a;
  const bAbs = b < 0 ? ~b + 1 : b;

  if (sign < 0) {
    return ~mulUpperUnsigned(aAbs, bAbs) + 1;
  }
  return mulUpperUnsigned(aAbs, bAbs);
}
