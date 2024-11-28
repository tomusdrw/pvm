import { Interpreter } from "./interpreter";
import { decodeProgram, getAssembly } from "./program";
import { NO_OF_REGISTERS, Registers } from "./registers";

export * from "./api";

export function exampleGetAssembly(program: u8[]): string {
  const p = decodeProgram(program);
  console.log(`Got program: ${p.toString()}`);
  return getAssembly(p);
}

export function exampleRun(program: u8[]): void {
  const p = decodeProgram(program);
  const registers: Registers = new StaticArray(NO_OF_REGISTERS);
  registers[7] = 9;
  const int = new Interpreter(p, registers);
  int.gas.set(10_000);

  let isOk = true;
  for (;;) {
    if (!isOk) {
      console.log(`Finished with status: ${int.status}`);
      break;
    }

    console.log(`PC = ${int.pc}`);
    console.log(`STATUS = ${int.status}`);
    console.log(`REGISTERS = ${registers.join(", ")}`);

    isOk = int.nextStep();
  }
}
