import {VmInput, getAssembly, runVm} from "./api-generic";
import { decodeProgram } from "./program";

export * from "./api";
export { runVm } from "./api-generic";

export function exampleGetAssembly(program: u8[]): string {
  const p = decodeProgram(program);
  return getAssembly(p);
}

export function exampleRun(program: u8[]): void {
  const input = new VmInput;
  input.registers[7] = 9;
  input.gas = 10_000;
  input.program = program;
  const output = runVm(input, true);
  console.log(`Finished with status: ${output.status}`);
}
