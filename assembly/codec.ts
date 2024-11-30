const MASKS = [<u8>0xff, 0xfe, 0xfc, 0xf8, 0xf0, 0xe0, 0xc0, 0x80];

const variableLength = (firstByte: u8): u8 => {
  const len = <u8>MASKS.length;
  for (let i: u8 = 0; i < len; i++) {
    if (firstByte >= MASKS[i]) {
      return 8 - i;
    }
  }
  return 0;
};

export class Decoder {
  constructor(
    private readonly source: Uint8Array,
    private offset: i32 = 0,
  ) {}

  isExhausted(): boolean {
    return this.offset >= this.source.length;
  }

  ensureBytes(need: u32): void {
    if (this.offset + need > this.source.length) {
      throw new Error(`Not enough bytes left. Need: ${need}, left: ${this.source.length - this.offset}`);
    }
  }

  varU32(): u32 {
    this.ensureBytes(1);
    const v = readVarU32(this.source.subarray(this.offset));
    this.offset += v.offset;
    return v.value;
  }

  u8(): u8 {
    this.ensureBytes(1);
    const v = this.source[this.offset];
    this.offset += 1;
    return v;
  }

  u32(): u32 {
    this.ensureBytes(4);
    let v: u32 = this.source[this.offset];
    v |= u32(this.source[this.offset + 1]) << 8;
    v |= u32(this.source[this.offset + 2]) << 16;
    v |= u32(this.source[this.offset + 3]) << 24;
    this.offset += 4;
    return v;
  }

  bytes(len: i32): Uint8Array {
    this.ensureBytes(len);
    const v = this.source.subarray(this.offset, this.offset + len);
    this.offset += len;
    return v;
  }
}

@unmanaged
export class ValOffset<T> {
  constructor(
    public readonly value: T,
    public readonly offset: i32,
  ) {}
}

/** Read variable-length u32 and return number of bytes read. */
export function readVarU32(data: Uint8Array): ValOffset<u32> {
  const length = i32(variableLength(data[0]));
  const first = u32(data[0]);
  if (length === 0) {
    return new ValOffset(first, 1);
  }

  if (data.length < length) {
    throw new Error(`Not enough bytes to decode 'varU32'. Need ${length}, got: ${data.length}`);
  }

  const msb = (first + 2 ** (8 - length) - 2 ** 8) << (length * 8);
  let number: i32 = 0;
  for (let i = length - 1; i >= 0; i--) {
    number = (number << 8) + data[1 + i];
  }
  number += msb;

  return new ValOffset(number, 1 + length);
}
