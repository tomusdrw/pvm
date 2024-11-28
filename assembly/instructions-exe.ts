import {Args} from "./arguments";
import {mulUpperSigned, mulUpperUnsigned} from "./math";
import {Memory} from "./memory";
import {Registers} from "./registers";

const MAX_SHIFT = 32;

type InstructionRun = (
  args: Args,
  registers: Registers,
  memory: Memory,
) => RunOutcome;

export enum Result {
  HALT = 0,
  PANIC = 2 ** 32 - 12,
  FAULT = 2 ** 32 - 13,
  HOST = 2 ** 32 - 14,
}

@unmanaged
export class RunOutcome {
  staticJump: i32 | null = null;
  dJump: u32 | null = null;
  result: Result | null = null;
  exitCode: u32 = 0;
}

function status(result: Result): RunOutcome {
  const r = new RunOutcome;
  r.result = result;
  return r;
}

function staticJump(offset: i32): RunOutcome {
  const r = new RunOutcome;
  r.staticJump = offset;
  return r;
}

function dJump(address: u32): RunOutcome {
  const r = new RunOutcome;
  r.dJump = address;
  return r;
}

function ok(): RunOutcome {
  return new RunOutcome;
}

function hostCall(id: u32) : RunOutcome {
  const r = new RunOutcome;
  r.result = Result.HOST;
  r.exitCode = id;
  return r;
}

function okOrFault(pageFault: u32 | null): RunOutcome {
  const r = new RunOutcome;
  if (pageFault !== null) {
    r.result = Result.FAULT;
    r.exitCode = pageFault;
  }
  return r;
}

export const RUN: InstructionRun[] = [
  // TRAP
  () => status(Result.PANIC),
  // LOAD_IND_U32
  (args, registers, memory) => {
    const address = registers[args.a] + args.c;
    const result = memory.getU32(address);
    if (result.fault === null) {
      registers[args.b] = result.ok;
    }
    return okOrFault(result.fault);
  },
  // ADD_IMM
  (args, registers) => {
    const sum = registers[args.a] + args.c;
    registers[args.b] = sum;
    return ok();
  },
  // STORE_IND_U32
  (args, registers, memory) => {
    const address = registers[args.a] + args.c;
    const fault = memory.setU32(address, registers[args.b]);
    return okOrFault(fault);
  },
  // LOAD_IMM
  (args, registers) => {
    registers[args.a] = args.b;
    return ok();
  },
  // JUMP
  (args) => {
    return staticJump(args.a);
  },
  // LOAD_IMM_JUMP
  (args, registers) => {
    registers[args.a] = args.b;
    return staticJump(args.c);
  },
  // BRANCH_EQ_IMM
  (args, registers) => {
    if (registers[args.a] === args.b) {
      return staticJump(args.c);
    }
    return ok();
  },
  // ADD
  (args, registers) => {
    registers[args.c] = registers[args.a] + registers[args.b];
    return ok();
  },
  // SHLO_L_IMM
  (args, registers) => {
    const shift = args.c;
    registers[args.b] = registers[args.a] << (shift % MAX_SHIFT);
    return ok();
  },
  // LOAD_U32
  (args, registers, memory) => {
    const result = memory.getU32(args.b);
    if (result.fault === null) {
      registers[args.a] = result.ok;
    }
    return okOrFault(result.fault);
  },
  // LOAD_IND_U8
  (args, registers, memory) => {
    const address = registers[args.a] + args.c;
    const result = memory.getU8(address);
    if (result.fault === null) {
      registers[args.b] = result.ok;
    }
    return okOrFault(result.fault);
  },
  // OR
  (args, registers) => {
    registers[args.c] = registers[args.a] | registers[args.b];
    return ok();
  },
  // STORE_IMM_IND_U32
  (args, registers, memory) => {
    const address = registers[args.a] + args.b;
    const pageFault = memory.setU32(address, args.c);
    return okOrFault(pageFault);
  },
  // SHLO_R_IMM
  (args, registers) => {
    const shift = args.c;
    registers[args.b] = registers[args.a] >>> (shift % MAX_SHIFT);
    return ok();
  },
  // BRANCH_NE_IMM
  (args, registers) => {
    if (registers[args.a] !== args.b) {
      return staticJump(args.c);
    }
    return ok();
  },
  // STORE_IND_U8
  (args, registers, memory) => {
    const address = registers[args.a] + args.c;
    const fault = memory.setU8(address, registers[args.b]);
    return okOrFault(fault);
  },
  // FALLTHROUGH
  () => ok(),
  // AND_IMM
  (args, registers) => {
    registers[args.b] = registers[args.a] & args.c;
    return ok();
  },
  // JUMP_IND
  (args, registers) => {
    const address = registers[args.a] + args.b;
    return dJump(address);
  },
  // SUB
  (args, registers) => {
    registers[args.c] = registers[args.a] - registers[args.b];
    return ok();
  },
  // LOAD_IND_I8
  (args, registers, memory) => {
    const address = registers[args.a] + args.c;
    const result = memory.getI8(address);
    if (result.fault === null) {
      registers[args.b] = result.ok;
    }
    return okOrFault(result.fault);
  },
  // STORE_U32
  (args, registers, memory) => {
    const fault = memory.setU32(args.c, registers[args.a]);
    return okOrFault(fault);
  },
  // AND
  (args, registers) => {
    registers[args.c] = registers[args.a] & registers[args.b];
    return ok();
  },
  // BRANCH_EQ
  (args, registers) => {
    if (registers[args.a] === registers[args.b]) {
      return staticJump(args.c);
    }
    return ok();
  },
  // SHAR_R_IMM
  (args, registers) => {
    const shift = args.c;
    registers[args.b] = registers[args.a] >> (shift % MAX_SHIFT);
    return ok();
  },
  // STORE_IMM_IND_U8
  (args, registers, memory) => {
    const address = registers[args.a] + args.b;
    const pageFault = memory.setU8(address, args.c);
    return okOrFault(pageFault);
  },
  // SET_LT_U_IMM
  (args, registers) => {
    registers[args.b] = registers[args.a] < args.c ? 1 : 0;
    return ok();
  },
  // XOR
  (args, registers) => {
    registers[args.c] = registers[args.a] ^ registers[args.b];
    return ok();
  },
  // STORE_IND_U16
  (args, registers, memory) => {
    const address = registers[args.a] + args.c;
    const fault = memory.setU16(address, registers[args.b]);
    return okOrFault(fault);
  },
  // BRANCH_NE
  (args, registers) => {
    if (registers[args.a] !== registers[args.b]) {
      return staticJump(args.c);
    }
    return ok();
  },
  // XOR_IMM
  (args, registers) => {
    registers[args.b] = registers[args.a] ^ args.c;
    return ok();
  },
  // BRANCH_LT_S_IMM
  (args, registers) => {
    if (<i32>(registers[args.a])< <i32>(args.b)) {
      return staticJump(args.c);
    }
    return ok();
  },
  // LOAD_IND_I16
  (args, registers, memory) => {
    const address = registers[args.a] + args.c;
    const result = memory.getI16(address);
    if (result.fault === null) {
      registers[args.b] = result.ok;
    }
    return okOrFault(result.fault);
  },
  // MUL
  (args, registers) => {
    registers[args.c] = registers[args.a] * registers[args.b];
    return ok();
  },
  // MUL_IMM
  (args, registers) => {
    registers[args.b] = registers[args.a] * args.c;
    return ok();
  },
  // SET_LT_U
  (args, registers) => {
    registers[args.c] = registers[args.a] < registers[args.b] ? 1 : 0;
    return ok();
  },
  // LOAD_IND_U16
  (args, registers, memory) => {
    const address = registers[args.a] + args.c;
    const result = memory.getU16(address);
    if (result.fault === null) {
      registers[args.b] = result.ok;
    }
    return okOrFault(result.fault);
  },
  // STORE_IMM_U32
  (args, _registers, memory) => {
    const address = args.a;
    const pageFault = memory.setU32(address, args.b);
    return okOrFault(pageFault);
  },
  // SET_GT_U_IMM
  (args, registers) => {
    registers[args.b] = registers[args.a] > args.c ? 1 : 0;
    return ok();
  },
  // NEG_ADD_IMM
  (args, registers) => {
    const sum = registers[args.a] - args.c;
    registers[args.b] = sum;
    return ok();
  },
  // BRANCH_GE_U
  (args, registers) => {
    if (registers[args.a] >= registers[args.b]) {
      return staticJump(args.c);
    }
    return ok();
  },
  // LOAD_IMM_JUMP_IND
  (args, registers) => {
    registers[args.a] = args.c;
    const address = registers[args.b] + args.d;
    return dJump(address);
  },
  // BRANCH_GE_S
  (args, registers) => {
    if (<i32>(registers[args.a]) >= <i32>(registers[args.b])) {
      return staticJump(args.c);
    }
    return ok();
  },
  // BRANCH_LT_U_IMM
  (args, registers) => {
    if (registers[args.a] < args.b) {
      return staticJump(args.c);
    }
    return ok();
  },
  // BRANCH_GE_S_IMM
  (args, registers) => {
    if (<i32>(registers[args.a]) >= <i32>(args.b)) {
      return staticJump(args.c);
    }
    return ok();
  },
  // BRANCH_LE_S_IMM
  (args, registers) => {
    if (<i32>(registers[args.a]) <= <i32>(args.b)) {
      return staticJump(args.c);
    }
    return ok();
  },
  // BRANCH_LT_U
  (args, registers) => {
    if (registers[args.a] < registers[args.b]) {
      return staticJump(args.c);
    }
    return ok();
  },
  // BRANCH_LT_U
  (args, registers) => {
    if (<i32>(registers[args.a]) < <i32>(registers[args.b])) {
      return staticJump(args.c);
    }
    return ok();
  },
  // OR_IMM
  (args, registers) => {
    registers[args.b] = registers[args.a] | args.c;
    return ok();
  },
  // BRANCH_GT_U_IMM
  (args, registers) => {
    if (registers[args.a] > args.b) {
      return staticJump(args.c);
    }
    return ok();
  },
  // SHLO_R
  (args, registers) => {
    const shift = registers[args.a];
    registers[args.c] = registers[args.b] >>> (shift % MAX_SHIFT);
    return ok();
  },
  // BRANCH_GE_U_IMM
  (args, registers) => {
    if (registers[args.a] >= args.b) {
      return staticJump(args.c);
    }
    return ok();
  },
  // BRANCH_GT_S_IMM
  (args, registers) => {
    if (<i32>(registers[args.a]) > <i32>(args.b)) {
      return staticJump(args.c);
    }
    return ok();
  },
  // STORE_IMM_IND_U16
  (args, registers, memory) => {
    const address = registers[args.a] + args.b;
    const pageFault = memory.setU16(address, args.c);
    return okOrFault(pageFault);
  },
  // SHLO_L
  (args, registers) => {
    const shift = registers[args.a];
    registers[args.c] = registers[args.b] << (shift % MAX_SHIFT);
    return ok();
  },
  // SET_LT_S_IMM
  (args, registers) => {
    registers[args.b] = <i32>(registers[args.a]) < <i32>(args.c) ? 1 : 0;
    return ok();
  },
  // MUL_UPPER_U_U
  (args, registers) => {
    registers[args.c] = mulUpperUnsigned(registers[args.a], registers[args.b]);
    return ok();
  },
  // SET_LT_S
  (args, registers) => {
    registers[args.c] = <i32>(registers[args.a]) < <i32>(registers[args.b]) ? 1 : 0;
    return ok();
  },
  // BRANCH_LE_U_IMM
  (args, registers) => {
    if (registers[args.a] <= args.b) {
      return staticJump(args.c);
    }
    return ok();
  },
  // LOAD_U8
  (args, registers, memory) => {
    const result = memory.getU8(args.b);
    if (result.fault === null) {
      registers[args.a] = result.ok;
    }
    return okOrFault(result.fault);
  },
  // SET_GT_S_IMM
  (args, registers) => {
    registers[args.b] = <i32>(registers[args.a]) > <i32>(args.c) ? 1 : 0;
    return ok();
  },
  // STORE_IMM_U8
  (args, _registers, memory) => {
    const address = args.a;
    const pageFault = memory.setU8(address, args.b);
    return okOrFault(pageFault);
  },
  // MUL_UPPER_U_U_IMM
  (args, registers) => {
    registers[args.b] = mulUpperUnsigned(registers[args.a], args.c);
    return ok();
  },
  // DIV_S
  (args, registers) => {
    if (registers[args.a] === 0) {
      registers[args.c] = 2**32 - 1;
    } else {
      registers[args.c] = <i32>(registers[args.b]) / <i32>(registers[args.a]);
    }
    return ok();
  },
  // MUL_UPPER_S_S_IMM
  (args, registers) => {
    registers[args.b] = mulUpperSigned(<i32>(registers[args.a]), <i32>(args.c));
    return ok();
  },
  // LOAD_I16
  (args, registers, memory) => {
    const result = memory.getI16(args.b);
    if (result.fault === null) {
      registers[args.a] = result.ok;
    }
    return okOrFault(result.fault);
  },
  // MUL_UPPER_S_S
  (args, registers) => {
    registers[args.c] = mulUpperSigned(<i32>(registers[args.a]), <i32>(registers[args.b]));
    return ok();
  },
  // DIV_U
  (args, registers) => {
    if (registers[args.a] === 0) {
      registers[args.c] = 2**32 - 1;
    } else {
      registers[args.c] = registers[args.b] / registers[args.a];
    }
    return ok();
  },
  // STORE_U16
  (args, registers, memory) => {
    const fault = memory.setU16(args.c, registers[args.a]);
    return okOrFault(fault);
  },
  // REM_S
  (args, registers) => {
    if (registers[args.a] === 0) {
      registers[args.c] = registers[args.b];
    } else {
      registers[args.c] = <i32>(registers[args.b]) % <i32>(registers[args.a]);
    }
    return ok();
  },
  // STORE_U8
  (args, registers, memory) => {
    const fault = memory.setU8(args.c, registers[args.a]);
    return okOrFault(fault);
  },
  // SHLO_R_IMM_ALT
  (args, registers) => {
    const shift = registers[args.a];
    registers[args.b] = args.c >>> (shift % MAX_SHIFT);
    return ok();
  },
  // REM_U
  (args, registers) => {
    if (registers[args.a] === 0) {
      registers[args.c] = registers[args.b];
    } else {
      registers[args.c] = registers[args.b] % registers[args.a];
    }
    return ok();
  },
  // LOAD_I8
  (args, registers, memory) => {
    const result = memory.getI8(args.b);
    if (result.fault === null) {
      registers[args.a] = result.ok;
    }
    return okOrFault(result.fault);
  },
  // SHLO_L_IMM_ALT
  (args, registers) => {
    const shift = registers[args.a];
    registers[args.b] = args.c << (shift % MAX_SHIFT);
    return ok();
  },
  // LOAD_U16
  (args, registers, memory) => {
    const result = memory.getU16(args.b);
    if (result.fault === null) {
      registers[args.a] = result.ok;
    }
    return okOrFault(result.fault);
  },
  // SHAR_R
  (args, registers) => {
    const shift = registers[args.a];
    registers[args.c] = registers[args.b] >> (shift % MAX_SHIFT);
    return ok();
  },
  // ECALLI
  (args) => {
    return hostCall(args.a);
  },
  // STORE_IMM_U16
  (args, _registers, memory) => {
    const address = args.a;
    const pageFault = memory.setU16(address, args.b);
    return okOrFault(pageFault);
  },
  // SHAR_R_IMM_ALT
  (args, registers) => {
    const shift = registers[args.a];
    registers[args.b] = args.c >> (shift % MAX_SHIFT);
    return ok();
  },
  // MUL_UPPER_S_U
  (args, registers) => {
    registers[args.c] = mulUpperSigned(<i32>(registers[args.a]), registers[args.b]);
    return ok();
  },
  // MOVE_REG
  (args, registers) => {
    registers[args.b] = registers[args.a];
    return ok();
  },
  // CMOV_IZ
  (args, registers) => {
    if (registers[args.a] === 0) {
      registers[args.c] = registers[args.b];
    }
    return ok();
  },
  // CMOV_NZ
  (args, registers) => {
    if (registers[args.a] !== 0) {
      registers[args.c] = registers[args.b];
    }
    return ok();
  },
  // CMOV_IZ_IMM
  (args, registers) => {
    if (registers[args.a] === 0) {
      registers[args.b] = args.c;
    }
    return ok();
  },
  // CMOV_NZ_IMM
  (args, registers) => {
    if (registers[args.a] !== 0) {
      registers[args.b] = args.c;
    }
    return ok();
  },
  // SBRK
  (args, registers, memory) => {
    registers[args.b] = memory.sbrk(registers[args.a]);
    return ok();
  }
];
