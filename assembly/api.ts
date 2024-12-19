import { InitialChunk, InitialPage, buildMemory } from "./api-generic";
import { Decoder } from "./codec";
import { Gas } from "./gas";
import { Interpreter, Status } from "./interpreter";
import { Access, PAGE_SIZE } from "./memory-page";
import { decodeProgram, liftBytes } from "./program";
import { NO_OF_REGISTERS, REG_SIZE_BYTES, Registers } from "./registers";

let interpreter: Interpreter | null = null;

export function resetGeneric(program: u8[], flatRegisters: u8[], initialGas: Gas): void {
  const p = decodeProgram(liftBytes(program));
  const registers: Registers = new StaticArray(NO_OF_REGISTERS);
  fillRegisters(registers, flatRegisters);
  const int = new Interpreter(p, registers);
  int.gas.set(initialGas);

  interpreter = int;
}
export function resetGenericWithMemory(
  program: u8[],
  flatRegisters: u8[],
  pageMap: Uint8Array,
  chunks: Uint8Array,
  initialGas: Gas,
): void {
  const p = decodeProgram(liftBytes(program));
  const registers: Registers = new StaticArray(NO_OF_REGISTERS);
  fillRegisters(registers, flatRegisters);

  const memory = buildMemory(readPages(pageMap), readChunks(chunks));

  const int = new Interpreter(p, registers, memory);
  int.gas.set(initialGas);

  interpreter = int;
}

export function nextStep(): boolean {
  if (interpreter !== null) {
    const int = <Interpreter>interpreter;
    return int.nextStep();
  }
  return false;
}

export function run(steps: u32): boolean {
  if (interpreter !== null) {
    const int = <Interpreter>interpreter;
    let isOk = true;
    for (let i: u32 = 0; i < steps; i++) {
      isOk = int.nextStep();
      if (!isOk) {
        return false;
      }
    }
    return isOk;
  }
  return false;
}

export function getProgramCounter(): u32 {
  if (interpreter === null) {
    return 0;
  }
  const int = <Interpreter>interpreter;
  return int.pc;
}

export function setNextProgramCounter(pc: u32): void {
  if (interpreter === null) {
    return;
  }
  const int = <Interpreter>interpreter;
  int.nextPc = pc;
}

export function getStatus(): u8 {
  if (interpreter === null) {
    return <u8>Status.PANIC;
  }
  const int = <Interpreter>interpreter;
  return <u8>int.status;
}

export function getExitArg(): u32 {
  if (interpreter === null) {
    return 0;
  }
  const int = <Interpreter>interpreter;
  return int.exitCode || 0;
}

export function getGasLeft(): i64 {
  if (interpreter === null) {
    return 0;
  }
  const int = <Interpreter>interpreter;
  return int.gas.get();
}

export function setGasLeft(gas: i64): void {
  if (interpreter !== null) {
    const int = <Interpreter>interpreter;
    int.gas.set(gas);
  }
}

export function getRegisters(): Uint8Array {
  const flat = new Uint8Array(NO_OF_REGISTERS * REG_SIZE_BYTES).fill(0);
  if (interpreter === null) {
    return flat;
  }

  const int = <Interpreter>interpreter;
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

export function setRegisters(flatRegisters: u8[]): void {
  if (interpreter === null) {
    return;
  }
  const int = <Interpreter>interpreter;
  fillRegisters(int.registers, flatRegisters);
}

export function getPageDump(index: u32): Uint8Array {
  if (interpreter === null) {
    return new Uint8Array(PAGE_SIZE).fill(0);
  }
  const int = <Interpreter>interpreter;
  const page = int.memory.pageDump(index);
  if (page === null) {
    return new Uint8Array(PAGE_SIZE).fill(0);
  }

  return page;
}

export function setMemory(address: u32, data: Uint8Array): void {
  if (interpreter === null) {
    return;
  }
  const int = <Interpreter>interpreter;
  const end = address + data.length;
  for (let i = address; i < end; i++) {
    // TODO [ToDr] handle page fault?
    int.memory.setU8(i, data[i]);
  }
}

function fillRegisters(registers: Registers, flat: u8[]): void {
  const len = registers.length * REG_SIZE_BYTES;
  if (len !== flat.length) {
    throw new Error(`Mismatching  registers size, got: ${flat.length}, expected: ${len}`);
  }

  for (let i = 0; i < registers.length; i++) {
    let num: u64 = 0;
    for (let j: u8 = 0; j < <u8>REG_SIZE_BYTES; j++) {
      const index = i * REG_SIZE_BYTES + j;
      num |= (<u64>flat[index]) << (j * 8);
    }
    registers[i] = num;
  }
}

function readPages(pageMap: Uint8Array): InitialPage[] {
  const pages: InitialPage[] = [];
  const codec = new Decoder(pageMap);
  while (!codec.isExhausted()) {
    const p = new InitialPage();
    p.address = codec.u32();
    p.length = codec.u32();
    p.access = codec.u8() > 0 ? Access.Write : Access.Read;
    pages.push(p);
  }
  return pages;
}

function readChunks(chunks: Uint8Array): InitialChunk[] {
  const res: InitialChunk[] = [];
  const codec = new Decoder(chunks);
  while (!codec.isExhausted()) {
    const c = new InitialChunk();
    c.address = codec.u32();
    const len = codec.u32();
    const data = codec.bytes(len);
    for (let i: u32 = 0; i < len; i++) {
      c.data.push(data[i]);
    }
    res.push(c);
  }
  return res;
}
