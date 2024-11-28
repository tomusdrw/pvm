import {Interpreter} from "./interpreter";
import {decodeProgram, getAssembly} from "./program";
import {NO_OF_REGISTERS, Registers} from "./registers";

export * from './api';


export function exampleGetAssembly(): string {
  const program: u8[] = [
    0, 0, 33, 4, 8, 1, 4, 9, 1, 5, 3, 0, 2, 119, 255, 7, 7, 12, 82, 138, 8, 152, 8, 82, 169, 5, 243, 82, 135, 4, 8, 4, 9,
    17, 19, 0, 73, 147, 82, 213, 0,
  ];

  const p = decodeProgram(program);

  console.log(p.toString());

  return getAssembly(p);
}

export function exampleRun(): void {
  const program: u8[] = [
    0, 0, 33, 4, 8, 1, 4, 9, 1, 5, 3, 0, 2, 119, 255, 7, 7, 12, 82, 138, 8, 152, 8, 82, 169, 5, 243, 82, 135, 4, 8, 4, 9,
    17, 19, 0, 73, 147, 82, 213, 0,
  ];

  const p = decodeProgram(program);
  const registers: Registers = new StaticArray(NO_OF_REGISTERS);
  registers[7] = 9;
  const int = new Interpreter(
    p,
    registers
  );
  int.gas.set(10_000);

  let isOk = true;
  for (;;) {
    if (!isOk) {
      console.log(`Finished with status: ${int.status}`);
      break;
    }

    console.log(`PC = ${int.pc}`);
    console.log(`STATUS = ${int.status}`);
    console.log(`REGISTERS = ${registers.join(', ')}`);

    isOk = int.nextStep();
  }

}
