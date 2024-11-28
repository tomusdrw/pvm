import { Decoder } from "./codec";
import { Gas } from "./gas";
import { Interpreter, Status } from "./interpreter";
import { Memory, MemoryBuilder } from "./memory";
import { Access, PAGE_SIZE } from "./memory-page";
import { decodeProgram } from "./program";
import { NO_OF_REGISTERS, Registers } from "./registers";

let interpreter: Interpreter | null = null;

export function resetGeneric(program: u8[], flatRegisters: u8[], initialGas: Gas): void {
  const p = decodeProgram(program);
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
  const p = decodeProgram(program);
  const registers: Registers = new StaticArray(NO_OF_REGISTERS);
  fillRegisters(registers, flatRegisters);
  const memory = buildMemory(pageMap, chunks);

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

const REG_SIZE_BYTES = 4;

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

function fillRegisters(registers: Registers, flat: u8[]): void {
  const len = registers.length * REG_SIZE_BYTES;
  if (len !== flat.length) {
    throw new Error(`Mismatching  registers size, got: ${flat.length}, expected: ${len}`);
  }

  for (let i = 0; i < registers.length; i++) {
    let num: u32 = 0;
    for (let j: u8 = 0; j < <u8>REG_SIZE_BYTES; j++) {
      const index = i * REG_SIZE_BYTES + j;
      num |= (<u32>flat[index]) << (j * 8);
    }
    registers[i] = num;
  }
}

class InitialPage {
  address: u32 = 0;
  length: u32 = 0;
  access: Access = Access.None;
}
class InitialChunk {
  address: u32 = 0;
  data: Uint8Array = new Uint8Array(0);
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
    c.data = codec.bytes(len);
    res.push(c);
  }
  return res;
}

function buildMemory(pageMap: Uint8Array, flatChunks: Uint8Array): Memory {
  console.log(`Got page: ${pageMap}`);
  console.log(`Got chunks: ${flatChunks}`);
  const pages = readPages(pageMap);
  const chunks = readChunks(flatChunks);

  const builder = new MemoryBuilder();
  for (let i = 0; i < pages.length; i++) {
    const initPage = pages[i];
    console.log(`setting page: ${initPage.address}..+${initPage.length}`);
    builder.setData(initPage.access, initPage.address, new Uint8Array(initPage.length));
  }

  for (let i = 0; i < chunks.length; i++) {
    const initChunk = chunks[i];
    console.log(`setting initial chunk: ${initChunk.address}..+${initChunk.data.length}`);
    // access should not matter now, since we created the pages already.
    builder.setData(Access.None, initChunk.address, initChunk.data);
  }

  return builder.build(0);
}
