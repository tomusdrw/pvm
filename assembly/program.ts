import { Args, Arguments, DECODERS, RELEVANT_ARGS } from "./arguments";
import { Decoder } from "./codec";
import { INSTRUCTIONS } from "./instructions";

export type ProgramCounter = u32;

export function decodeProgram(program: u8[]): Program {
  const p = new Uint8Array(program.length);
  p.set(program, 0);
  const decoder = new Decoder(p);

  // number of items in the jump table
  const jumpTableLength = decoder.varU32();
  // how many bytes are used to encode a single item of the jump table
  const jumpTableItemLength = decoder.u8();
  // the length of the code (in bytes).
  const codeLength = decoder.varU32();

  const jumpTableLengthInBytes = jumpTableLength * jumpTableItemLength;
  const rawJumpTable = decoder.bytes(jumpTableLengthInBytes);

  const rawCode = decoder.bytes(codeLength);
  const rawMask = decoder.bytes((codeLength + 7) / 8);

  const mask = new Mask(rawMask, codeLength);
  const jumpTable = new JumpTable(jumpTableItemLength, rawJumpTable);
  const basicBlocks = new BasicBlocks(rawCode, mask);

  return new Program(rawCode, mask, jumpTable, basicBlocks);
}

export class Mask {
  // NOTE: might be longer than code (bit-alignment)
  readonly bytesToSkip: StaticArray<u8>;

  constructor(packedMask: Uint8Array, codeLength: i32) {
    this.bytesToSkip = new StaticArray<u8>(codeLength);
    let lastInstructionOffset: u8 = 0;
    for (let i = packedMask.length - 1; i >= 0; i -= 1) {
      let bits = packedMask[i];
      const index = i * 8;
      for (let b = 7; b >= 0; b--) {
        const isSet = bits & 0b1000_0000;
        bits = bits << 1;
        if (index + b < codeLength) {
          lastInstructionOffset = isSet ? 0 : lastInstructionOffset + 1;
          this.bytesToSkip[index + b] = lastInstructionOffset;
        }
      }
    }
  }

  isInstruction(index: ProgramCounter): boolean {
    if (index >= <u32>this.bytesToSkip.length) {
      return false;
    }

    return this.bytesToSkip[index] === 0;
  }

  argsLen(i: u32): u8 {
    if (i + 1 < <u32>this.bytesToSkip.length) {
      return this.bytesToSkip[i + 1];
    }
    return 0;
  }

  toString(): string {
    let v = "Mask[";
    for (let i = 0; i < this.bytesToSkip.length; i += 1) {
      v += `${this.bytesToSkip[i]}, `;
    }
    return `${v}]`;
  }
}

export enum BasicBlock {
  NONE = 0,
  START = 2,
  END = 4,
}

export class BasicBlocks {
  readonly isStartOrEnd: StaticArray<BasicBlock>;

  constructor(code: Uint8Array, mask: Mask) {
    const len = code.length;
    const isStartOrEnd = new StaticArray<BasicBlock>(len);
    let inBlock = false;
    for (let i: i32 = 0; i < len; i += 1) {
      const skip = mask.bytesToSkip[i];
      const isInstruction = skip === 0;
      if (isInstruction && !inBlock) {
        inBlock = true;
        isStartOrEnd[i] += BasicBlock.START;
      }
      // in case of start blocks, some of them might be both start & end;
      if (isInstruction && inBlock && INSTRUCTIONS[code[i]].isTerminating) {
        inBlock = false;
        isStartOrEnd[i] += BasicBlock.END;
      }
    }
    this.isStartOrEnd = isStartOrEnd;
  }

  isStart(newPc: u32): boolean {
    if (newPc < <u32>this.isStartOrEnd.length) {
      return (this.isStartOrEnd[newPc] & BasicBlock.START) > 0;
    }
    return false;
  }

  toString(): string {
    let v = "BasicBlocks[";
    for (let i = 0; i < this.isStartOrEnd.length; i += 1) {
      let t = "";
      const isStart = (this.isStartOrEnd[i] & BasicBlock.START) > 0;
      t += isStart ? "start" : "";
      const isEnd = (this.isStartOrEnd[i] & BasicBlock.END) > 0;
      t += isEnd ? "end" : "";
      v += `${i} -> ${t}, `;
    }
    return `${v}]`;
  }
}

export class JumpTable {
  readonly jumps: StaticArray<ProgramCounter>;

  constructor(itemBytes: u8, data: Uint8Array) {
    const jumps = new StaticArray<ProgramCounter>(itemBytes > 0 ? data.length / itemBytes : 0);

    for (let i = 0; i < data.length; i += itemBytes) {
      let num = 0;
      for (let j = itemBytes - 1; j >= 0; j--) {
        num = num << 8;
        num += data[i + j];
      }
      jumps[i / itemBytes] = num;
    }

    this.jumps = jumps;
  }

  toString(): string {
    let v = "JumpTable[";
    for (let i = 0; i < this.jumps.length; i += 1) {
      v += `${i} -> ${this.jumps[i]}, `;
    }
    return `${v}]`;
  }
}

export class Program {
  constructor(
    public readonly code: Uint8Array,
    public readonly mask: Mask,
    public readonly jumpTable: JumpTable,
    public readonly basicBlocks: BasicBlocks,
  ) {}

  toString(): string {
    return `Program { code: ${this.code}, mask: ${this.mask}, jumpTable: ${this.jumpTable}, basicBlocks: ${this.basicBlocks} }`;
  }
}

export function getAssembly(p: Program): string {
  let v = "";
  const len = p.code.length;
  for (let i = 0; i < len; i++) {
    if (!p.mask.isInstruction(i)) {
      throw new Error("We should iterate only over instructions!");
    }
    const instruction = p.code[i];
    const iData = INSTRUCTIONS[instruction];
    v += "\n";
    v += changetype<string>(iData.namePtr);

    const argsLen = p.mask.argsLen(i);
    const args = decodeArguments(iData.kind, p.code.subarray(i + 1, i + 1 + argsLen));
    const argsArray = [args.a, args.b, args.c, args.d];
    const relevantArgs = <i32>RELEVANT_ARGS[iData.kind];
    for (let i = 0; i < relevantArgs; i++) {
      v += ` ${argsArray[i]}, `;
    }
    i += argsLen;
  }
  return v;
}

export function decodeArguments(kind: Arguments, data: Uint8Array): Args {
  return DECODERS[kind](data);
}
