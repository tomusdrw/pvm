import {Arguments} from "./arguments";
import {Gas} from "./gas";

@unmanaged
export class Instruction {
  namePtr: usize = 0;
  kind: Arguments = Arguments.Zero;
  gas: Gas = 0;
  isTerminating: boolean = false;
}

function instruction(name: string, kind: Arguments, gas: Gas, isTerminating: boolean = false): Instruction {
  const i = new Instruction;
  i.namePtr = changetype<usize>(name);
  i.kind = kind;
  i.gas = gas;
  i.isTerminating = isTerminating;
  return i;
}

export const INSTRUCTIONS = [
  instruction("TRAP", Arguments.Zero, 1, true),
  instruction("LOAD_IND_U32", Arguments.TwoRegOneImm, 1), 
  instruction("ADD_IMM", Arguments.TwoRegOneImm, 1), 
  instruction("STORE_IND_U32", Arguments.TwoRegOneImm, 1),
  instruction("LOAD_IMM",Arguments.OneRegOneImm, 1), 
  instruction("JUMP",Arguments.OneOff, 1, true),  
  instruction("LOAD_IMM_JUMP",Arguments.OneRegOneImmOneOff, 1, true),
  instruction("BRANCH_EQ_IMM",Arguments.OneRegOneImmOneOff, 1, true),
  instruction("ADD",Arguments.ThreeReg, 1),
  instruction("SHLO_L_IMM", Arguments.TwoRegOneImm, 1),
  instruction("LOAD_U32", Arguments.OneRegOneImm, 1),
  instruction("LOAD_IND_U8", Arguments.TwoRegOneImm, 1),
  instruction("OR",Arguments.ThreeReg, 1),
  instruction("STORE_IMM_IND_U32", Arguments.OneRegTwoImm, 1),
  instruction("SHLO_R_IMM", Arguments.TwoRegOneImm, 1),
  instruction("BRANCH_NE_IMM",Arguments.OneRegOneImmOneOff, 1, true),
  instruction("STORE_IND_U8", Arguments.TwoRegOneImm, 1),
  instruction("FALLTHROUGH", Arguments.Zero, 1, true),
  instruction("AND_IMM", Arguments.TwoRegOneImm, 1),
  instruction("JUMP_IND",Arguments.OneRegOneImm, 1, true),
  instruction("SUB",Arguments.ThreeReg, 1),
  instruction("LOAD_IND_I8", Arguments.TwoRegOneImm, 1),
  instruction("STORE_U32",Arguments.OneRegOneImm, 1),
  instruction("AND",Arguments.ThreeReg, 1),
  instruction("BRANCH_EQ",Arguments.TwoRegOneOff, 1, true),
  instruction("SHAR_R_IMM", Arguments.TwoRegOneImm, 1),
  instruction("STORE_IMM_IND_U8", Arguments.OneRegTwoImm, 1),
  instruction("SET_LT_U_IMM", Arguments.TwoRegOneImm, 1),
  instruction("XOR",Arguments.ThreeReg, 1),
  instruction("STORE_IND_U16", Arguments.TwoRegOneImm, 1),
  instruction("BRANCH_NE",Arguments.TwoRegOneOff, 1, true),
  instruction("XOR_IMM", Arguments.TwoRegOneImm, 1),
  instruction("BRANCH_LT_S_IMM",Arguments.OneRegOneImmOneOff, 1, true),
  instruction("LOAD_IND_I16", Arguments.TwoRegOneImm, 1),
  instruction("MUL",Arguments.ThreeReg, 1),
  instruction("MUL_IMM", Arguments.TwoRegOneImm, 1),
  instruction("SET_LT_U", Arguments.ThreeReg, 1),
  instruction("LOAD_IND_U16", Arguments.TwoRegOneImm, 1),
  instruction("STORE_IMM_U32",Arguments.TwoImm, 1),
  instruction("SET_GT_U_IMM", Arguments.TwoRegOneImm, 1),
  instruction("NEG_ADD_IMM", Arguments.TwoRegOneImm, 1),
  instruction("BRANCH_GE_U",Arguments.TwoRegOneOff, 1, true),
  instruction("LOAD_IMM_JUMP_IND",Arguments.TwoRegTwoImm, 1, true),
  instruction("BRANCH_GE_S",Arguments.TwoRegOneOff, 1, true),
  instruction("BRANCH_LT_U_IMM",Arguments.OneRegOneImmOneOff, 1, true),
  instruction("BRANCH_GE_S_IMM",Arguments.OneRegOneImmOneOff, 1, true),
  instruction("BRANCH_LE_S_IMM",Arguments.OneRegOneImmOneOff, 1, true),
  instruction("BRANCH_LT_U",Arguments.TwoRegOneOff, 1, true),
  instruction("BRANCH_LT_S",Arguments.TwoRegOneOff, 1, true),
  instruction("OR_IMM", Arguments.TwoRegOneImm, 1),
  instruction("BRANCH_GT_U_IMM",Arguments.OneRegOneImmOneOff, 1, true),
  instruction("SHLO_R",Arguments.ThreeReg, 1),
  instruction("BRANCH_GE_U_IMM",Arguments.OneRegOneImmOneOff, 1, true),
  instruction("BRANCH_GT_S_IMM",Arguments.OneRegOneImmOneOff, 1, true),
  instruction("STORE_IMM_IND_U16", Arguments.OneRegTwoImm, 1),
  instruction("SHLO_L",Arguments.ThreeReg, 1),
  instruction("SET_LT_S_IMM", Arguments.TwoRegOneImm, 1),
  instruction("MUL_UPPER_U_U",Arguments.ThreeReg, 1),
  instruction("SET_LT_S",Arguments.ThreeReg, 1),
  instruction("BRANCH_LE_U_IMM",Arguments.OneRegOneImmOneOff, 1, true),
  instruction("LOAD_U8",Arguments.OneRegOneImm, 1),
  instruction("SET_GT_S_IMM", Arguments.TwoRegOneImm, 1),
  instruction("STORE_IMM_U8",Arguments.TwoImm, 1),
  instruction("MUL_UPPER_U_U_IMM", Arguments.TwoRegOneImm, 1),
  instruction("DIV_S",Arguments.ThreeReg, 1),
  instruction("MUL_UPPER_S_S_IMM", Arguments.TwoRegOneImm, 1),
  instruction("LOAD_I16",Arguments.OneRegOneImm, 1),
  instruction("MUL_UPPER_S_S",Arguments.ThreeReg, 1),
  instruction("DIV_U",Arguments.ThreeReg, 1),
  instruction("STORE_U16",Arguments.OneRegOneImm, 1),
  instruction("REM_S",Arguments.ThreeReg, 1),
  instruction("STORE_U8",Arguments.OneRegOneImm, 1),
  instruction("SHLO_R_IMM_ALT", Arguments.TwoRegOneImm, 1),
  instruction("REM_U",Arguments.ThreeReg, 1),
  instruction("LOAD_I8",Arguments.OneRegOneImm, 1),
  instruction("SHLO_L_IMM_ALT", Arguments.TwoRegOneImm, 1),
  instruction("LOAD_U16",Arguments.OneRegOneImm, 1),
  instruction("SHAR_R",Arguments.ThreeReg, 1),
  instruction("ECALLI",Arguments.OneImm, 1),
  instruction("STORE_IMM_U16",Arguments.TwoImm, 1),
  instruction("SHAR_R_IMM_ALT", Arguments.TwoRegOneImm, 1),
  instruction("MUL_UPPER_S_U",Arguments.ThreeReg, 1),
  instruction("MOVE_REG",Arguments.TwoReg, 1),
  instruction("CMOV_IZ",Arguments.ThreeReg, 1),
  instruction("CMOV_NZ",Arguments.ThreeReg, 1),
  instruction("CMOV_IZ_IMM", Arguments.TwoRegOneImm, 1),
  instruction("CMOV_NZ_IMM", Arguments.TwoRegOneImm, 1),
  instruction("SBRK",Arguments.TwoReg, 1),
];
