@unmanaged
export class MaybePageFault {
  isFault: boolean = false;
  fault: u32 = 0;
}

@unmanaged
export class Result {
  ok: u32 = 0;
  fault: MaybePageFault = new MaybePageFault();
}

export class Memory {
  sbrk(_amount: u32): u32 {
    throw new Error("Method not implemented.");
  }

  getU16(_address: u32): Result {
    throw new Error("Method not implemented.");
  }

  getI16(_address: u32): Result {
    throw new Error("Method not implemented.");
  }

  getI8(_address: u32): Result {
    throw new Error("Method not implemented.");
  }

  getU8(_address: u32): Result {
    throw new Error("Method not implemented.");
  }

  getU32(_address: u32): Result {
    throw new Error("Method not implemented.");
  }

  setU8(_address: u32, _value: u8): MaybePageFault {
    throw new Error("Method not implemented.");
  }

  setU16(_address: u32, _value: u16): MaybePageFault {
    throw new Error("Method not implemented.");
  }

  setU32(_address: u32, _value: u32): MaybePageFault {
    throw new Error("Method not implemented.");
  }
}
