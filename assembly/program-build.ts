import {Arguments, REQUIRED_BYTES, nibbles} from "./arguments";
import {encodeVarU32} from "./codec";
import {INSTRUCTIONS, MISSING_INSTRUCTION} from "./instructions";

/** Turn given bytecode into a valid program. Add JumpTable and Mask. */
export function wrapAsProgram(bytecode: Uint8Array): Uint8Array {
  const jumpTableLength: u8 = 0;
  const jumpTableItemLength: u8 = 0;
  const codeLength = bytecode.length;
  const mask = buildMask(bytecode);
  const codeLengthBytes = encodeVarU32(codeLength);

  const data = new Uint8Array(1 + 1 + codeLengthBytes.length + codeLength + mask.length);
  data[0] = jumpTableLength;
  data[1] = jumpTableItemLength;
  let offset = 2;
  for (let i = 0; i < codeLengthBytes.length; i++) {
    data[offset] = codeLengthBytes[i];
    offset++;
  }
  for (let i = 0; i < bytecode.length; i++) {
    data[offset] = bytecode[i];
    offset++;
  }
  for (let i = 0; i < mask.length; i++) {
    data[offset] = mask[i];
    offset++;
  }
  return data;
}

function skipBytes(kind: Arguments, data: Uint8Array): i32 {
  switch (kind) {
    case Arguments.Zero:
      return 0;
    case Arguments.OneImm:
      return immBytes(data.length, 0);
    case Arguments.TwoImm: {
      const n = nibbles(data[0]);
      const split = n.low + 1;
      return 1 + split + immBytes(data.length, split + 1);
    }
    case Arguments.OneOff:
      return immBytes(data.length, 0);
    case Arguments.OneRegOneImm:
      return 1 + immBytes(data.length, 1);
    case Arguments.OneRegOneExtImm:
      return 9;
    case Arguments.OneRegTwoImm: {
      const n = nibbles(data[0]);
      const split = n.hig + 1;
      return 1 + split + immBytes(data.length, 1 + split);
    }
    case Arguments.OneRegOneImmOneOff: {
      const n = nibbles(data[0]);
      const split = n.hig + 1;
      return 1 + split + immBytes(data.length, 1 + split);
    }
    case Arguments.TwoReg:
      return 1;
    case Arguments.TwoRegOneImm:
      return 1 + i32(Math.min(4, data.length));
    case Arguments.TwoRegOneOff:
      return 1 + i32(Math.min(4, data.length));
    case Arguments.TwoRegTwoImm:
      const n = nibbles(data[1]);
      const split = n.low + 1;
      return 2 + split + immBytes(data.length, 2 + split);
    case Arguments.ThreeReg:
      return 2;
    default:
      throw new Error(`Unhandled arguments kind: ${kind}`);
  }
}

function buildMask(bytecode: Uint8Array): u8[] {
  const mask = new StaticArray<boolean>(bytecode.length);
  for (let i = 0; i < bytecode.length; i++) {
    const instruction = bytecode[i];
    const iData = <i32>instruction < INSTRUCTIONS.length ? INSTRUCTIONS[instruction] : MISSING_INSTRUCTION;
    mask[i] = true;

    const requiredBytes = REQUIRED_BYTES[iData.kind];
    if (i + 1 + requiredBytes <= bytecode.length) {
      const skip = skipBytes(iData.kind, bytecode.subarray(i + 1));
      i += skip;
    }
  }
  // pack mask
  const packed: u8[] = [];
  for (let i = 0; i < mask.length; i += 8) {
    let byte: u8 = 0;
    for (let j = i; j < i + 8; j++) {
      if (j < mask.length) {
        byte |= mask[j] ? 1 : 0; 
      } else {
        byte |= 1;
      }
      byte << 1;
    }
    packed.push(byte);
  }
  return packed;
}

function immBytes(dataLength: i32, required: i32): i32 {
  if (dataLength < required) {
    return 0;
  }
  return i32(Math.min(4, dataLength - required));
}
