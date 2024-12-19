import { GasCounter, gasCounter } from "./gas";
import { INSTRUCTIONS, MISSING_INSTRUCTION } from "./instructions";
import { RUN } from "./instructions-exe";
import { Outcome, Result } from "./instructions-outcome";
import { Memory, MemoryBuilder } from "./memory";
import { BasicBlocks, JumpTable, Program, decodeArguments } from "./program";
import { Registers } from "./registers";

export enum Status {
  OK = -1,
  HALT = 0,
  PANIC = 1,
  FAULT = 2,
  HOST = 3,
  OOG = 4,
}

export class Interpreter {
  public readonly program: Program;
  public readonly registers: Registers;
  public readonly memory: Memory;
  public readonly gas: GasCounter;
  public pc: u32;
  public status: Status;
  public exitCode: u32;
  public nextPc: u32;

  constructor(program: Program, registers: Registers, memory: Memory = new MemoryBuilder().build(0)) {
    this.program = program;
    this.registers = registers;
    this.memory = memory;
    this.gas = gasCounter(0);
    this.pc = 0;
    this.status = Status.OK;
    this.exitCode = 0;
    this.nextPc = 0;
  }

  nextStep(): boolean {
    if (this.status !== Status.OK) {
      return false;
    }

    // TODO [ToDr] Some weird pre-init step for the debugger?
    if (this.nextPc !== -1) {
      this.pc = this.nextPc;
      this.nextPc = -1;
      return true;
    }

    // reset some stuff at start
    this.exitCode = 0;

    const pc = this.pc;
    // check if we are at the right location
    if (!this.program.mask.isInstruction(pc)) {
      // TODO [ToDr] Potential edge case here?
      if (this.gas.sub(1)) {
        this.status = Status.OOG; 
      } else {
        this.status = Status.PANIC;
      }
      return false;
    }

    const instruction = this.program.code[pc];
    const iData = <i32>instruction < INSTRUCTIONS.length ? INSTRUCTIONS[instruction] : MISSING_INSTRUCTION;

    // check gas (might be done for each block instead).
    if (this.gas.sub(iData.gas)) {
      this.status = Status.OOG;
      return false;
    }

    if (iData === MISSING_INSTRUCTION) {
      this.status = Status.PANIC;
      return false;
    }

    // get args and invoke instruction
    const argsLen = this.program.mask.argsLen(pc);
    const end = pc + 1 + argsLen;
    if (end > <u32>this.program.code.length) {
      this.status = Status.PANIC;
      return false;
    }

    const args = decodeArguments(iData.kind, this.program.code.subarray(pc + 1, end));
    if (args === null) {
      this.status = Status.PANIC;
      return false;
    }

    const exe = RUN[instruction];
    const outcome = exe(args, this.registers, this.memory);

    // TODO [ToDr] Spaghetti
    switch (outcome.outcome) {
      case Outcome.DynamicJump: {
        const res = dJump(this.program.jumpTable, outcome.dJump);
        if (res.status === DjumpStatus.HALT) {
          this.status = Status.HALT;
          return true;
        }
        if (res.status === DjumpStatus.PANIC) {
          this.status = Status.PANIC;
          return false;
        }
        const branchResult = branch(this.program.basicBlocks, res.newPc, 0);
        if (!branchResult.isOkay) {
          this.status = Status.PANIC;
          return false;
        }
        this.pc = branchResult.newPc;
        return true;
      }
      case Outcome.StaticJump: {
        const branchResult = branch(this.program.basicBlocks, pc, outcome.staticJump);
        if (!branchResult.isOkay) {
          this.status = Status.PANIC;
          return false;
        }

        this.pc = branchResult.newPc;
        return true;
      }
      case Outcome.Result: {
        if (outcome.result === Result.HOST) {
          this.status = Status.HOST;
          this.exitCode = outcome.exitCode;
          return false;
        }
        if (outcome.result === Result.FAULT) {
          this.gas.sub(1);
          this.status = Status.FAULT;
          this.exitCode = outcome.exitCode;
          return false;
        }
        if (outcome.result === Result.PANIC) {
          this.status = Status.PANIC;
          return false;
        }

        throw new Error("Unknown result");
      }
      case Outcome.Ok: {
        // by default move to next instruction.
        this.pc += 1 + argsLen;

        return true;
      }
    }

    return false;
  }
}

// @unmanaged
class BranchResult {
  isOkay: boolean = false;
  newPc: u32 = 0;
}

function branch(basicBlocks: BasicBlocks, pc: u32, offset: i32): BranchResult {
  const r = new BranchResult();
  const newPc = pc + offset;
  if (basicBlocks.isStart(newPc)) {
    r.isOkay = true;
    r.newPc = newPc;
  }
  return r;
}

enum DjumpStatus {
  OK = 0,
  HALT = 1,
  PANIC = 2,
}

// @unmanaged
class DjumpResult {
  status: DjumpStatus = DjumpStatus.OK;
  newPc: u32 = 0;
}

const EXIT = 0xff_ff_00_00;
const JUMP_ALIGMENT_FACTOR = 2;

function dJump(jumpTable: JumpTable, address: u32): DjumpResult {
  const r = new DjumpResult();
  if (address === EXIT) {
    r.status = DjumpStatus.HALT;
    return r;
  }
  if (address === 0 || address % JUMP_ALIGMENT_FACTOR !== 0) {
    r.status = DjumpStatus.PANIC;
    return r;
  }

  const index = address / JUMP_ALIGMENT_FACTOR - 1;
  if (index >= <u32>jumpTable.jumps.length) {
    r.status = DjumpStatus.PANIC;
    return r;
  }

  r.newPc = jumpTable.jumps[index];
  return r;
}
