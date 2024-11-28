export type MaybePageFault = u32 | null;

@unmanaged
export class Result {
  ok: u32 = 0;
  fault: MaybePageFault = null;
}

export class Memory {
  sbrk(amount: u32): u32 {
    throw new Error("Method not implemented.");
  }
  getU16(address: u32): Result {
    throw new Error("Method not implemented.");
  }
  getI16(address: u32): Result {
    throw new Error("Method not implemented.");
  }
  getI8(address: u32): Result {
    throw new Error("Method not implemented.");
  }
  getU8(address: u32): Result {
    throw new Error("Method not implemented.");
  }

  getU32(address: u32): Result {
    throw new Error("Method not implemented.");
  }

  setU8(address: u32, value: u8): MaybePageFault {
    throw new Error("Method not implemented.");
  }

  setU16(address: u32, arg1: u16): MaybePageFault {
    throw new Error("Method not implemented.");
  }

  setU32(address: u32, value: u32): MaybePageFault {
    throw new Error("Method not implemented.");
  }
}
