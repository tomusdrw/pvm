import {Gas, GasCounter, gasCounter} from "./gas";
import {INSTRUCTIONS} from "./instructions";
import {Program, decodeArguments, decodeProgram} from "./program";
import {Registers} from "./registers";

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
  public readonly gas: GasCounter;
  public pc: u32;
  public status: Status;

  constructor(
    program: Program,
    registers: Registers,
  ) {
    this.program = program;
    this.registers = registers;
    this.gas = gasCounter(0);
    this.pc = 0;
    this.status = Status.OK;
  }

  nextStep(): boolean {
    if (this.status !== Status.OK) {
      return false;
    }

    const pc = this.pc;
    // check if we are at the right location
    if (!this.program.mask.isInstruction(pc)) {
      this.status = Status.PANIC;
      return false;
    }

    const instruction = this.program.code[pc];
    const iData = INSTRUCTIONS[instruction];

    // check gas (might be done for each block instead).
    if (this.gas.sub(iData.gas)) {
      this.status = Status.OOG;
      return false;
    }

    // get args and invoke instruction
    const argsLen = this.program.mask.argsLen(pc);
    const args = decodeArguments(
      iData.kind,
      this.program.code.subarray(pc, pc + argsLen)
    ); 

    runInstruction(
      instruction,
      args,
      this.registers,
      //this.memory,
    );

    return true;
  }
}
