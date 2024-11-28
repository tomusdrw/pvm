@unmanaged
export class MaybePageFault {
  isFault: boolean = false;
  fault: u32 = 0;
}

@unmanaged
export class Result {
  ok: u32 = 0;
  fault: MaybePageFault = new MaybePageFault;
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
