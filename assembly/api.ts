import {Gas} from "./gas";
import {Interpreter, Status} from "./interpreter";
import {decodeProgram} from "./program";
import {NO_OF_REGISTERS, Registers} from "./registers";

let interpreter: Interpreter | null = null;

export function resetGeneric(
  program: u8[],
  flatRegisters: u8[],
  initialGas: Gas,
): void {
  const p = decodeProgram(program);
  const registers: Registers = new StaticArray(NO_OF_REGISTERS);
  fillRegisters(registers, flatRegisters);
  const int = new Interpreter(
    p,
    registers
  );
  int.gas.set(initialGas);

  interpreter = int;
}
export function resetGenericWithMemory(
  program: u8[],
  flatRegisters: u8[],
  pageMap: u8[],
  chunks: u8[],
  initialGas: Gas,
): void {
  // TODO [ToDr] memory not available yet.
  resetGeneric(program, flatRegisters, initialGas);
}

export function nextStep(): boolean {
  if (interpreter !== null) {
    const int = <Interpreter>(interpreter);
    return int.nextStep();
  }
  return false;
}

export function getProgramCounter(): u32 {
  if (interpreter === null) {
    return 0;
  }
  const int = <Interpreter>(interpreter);
  return int.pc;
}

export function setNextProgramCounter(pc: u32): void {
  if (interpreter === null) {
    return;
  }
  const int = <Interpreter>(interpreter);
  int.pc = pc;
}

export function getStatus(): u8 {
  if (interpreter === null) {
    return <u8>(Status.PANIC);
  }
  const int = <Interpreter>(interpreter);
  return <u8>(int.status);
}

export function getExitArg(): u32 {
  if (interpreter === null) {
    return 0;
  }
  const int = <Interpreter>(interpreter);
  return int.exitCode || 0; 
}

export function getGasLeft(): i64 {
  if (interpreter === null) {
    return 0;
  }
  const int = <Interpreter>(interpreter);
  return int.gas.get();
}

export function setGasLeft(gas: i64): void {
  if (interpreter !== null) {
    const int = <Interpreter>(interpreter);
    int.gas.set(gas);
  }
}


const REG_SIZE_BYTES = 4;

export function getRegisters(): u8[] {
  const flat = new Array<u8>(NO_OF_REGISTERS * REG_SIZE_BYTES).fill(0);
  if (interpreter === null) {
    return flat;
  }

  const int = <Interpreter>(interpreter);
  for (let i = 0; i < int.registers.length; i++) {
    let val = int.registers[i];
    for (let j = 0; j < REG_SIZE_BYTES; j++) {
      const index = i * REG_SIZE_BYTES + j;
      flat[index] = <u8>(val & 0xff);
      val = val >> 8;
    }
  }

  return flat;
}

export function getPageDump(_index: u32): u8[] {
  const page = new Array<u8>(4096).fill(0);
  // TODO [ToDr] read from memory.
  return page;
}

function fillRegisters(registers: Registers, flat: u8[]): void {
  const len = registers.length * REG_SIZE_BYTES;
  if (len !== flat.length) {
    throw new Error(`Mismatching  registers size, got: ${flat.length}, expected: ${len}`);
  }

  for (let i = 0; i < registers.length; i++) {
    let num = 0;
    for (let j: u8 = 0; j < <u8>REG_SIZE_BYTES; j++) {
      const index = i * REG_SIZE_BYTES + j;
      num |= flat[index] << (j * 8);
    }
    registers[i] = num;
  }
}
