import {Gas} from "./gas";
import {Interpreter} from "./interpreter";
import {decodeProgram} from "./program";
import {Registers} from "./registers";

let interpreter = null;

export function reset(
  program: u8[],
  pc: u32,
  initialGas: Gas,
  registers: Registers,
): void {
  const p = decodeProgram(program);
  interpreter = new Interpreter(
    p,
    registers
  );
  interpreter.gas.set(initialGas);
  interpreter.pc = pc;
}
