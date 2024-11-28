import {Gas} from "./gas";

export enum Kind {
  NoArgs,
  OneImm,
  TwoImm,
  OneOff,
  OneRegOneImm,
  OneRegTwoImm,
  OneRegOneImmOneOff,
  TwoReg,
  TwoRegOneImm,
  TwoRegOneOff,
  TwoRegTwoImm,
  ThreeReg,
}

@unmanaged
export class Instruction {
  namePtr: usize = 0;
  kind: Kind = Kind.NoArgs;
  gas: Gas = 0;
  isTerminating: boolean = false;
}

function instruction(name: string, kind: Kind, gas: Gas, isTerminating: boolean = false): Instruction {
  const i = new Instruction;
  i.namePtr = changetype<usize>(name);
  i.kind = kind;
  i.gas = gas;
  i.isTerminating = isTerminating;
  return i;
}

export const INSTRUCTIONS = [
  instruction("TRAP", Kind.NoArgs, 1, true),
  instruction("LOAD_IND_U32", Kind.TwoRegOneImm, 1), 
  instruction("ADD_IMM", Kind.TwoRegOneImm, 1), 
  instruction("STORE_IND_U32", Kind.TwoRegOneImm, 1),
  instruction("LOAD_IMM",Kind.OneRegOneImm, 1), 
  instruction("JUMP",Kind.OneOff, 1, true),  
  instruction("LOAD_IMM_JUMP",Kind.OneRegOneImmOneOff, 1, true),
  instruction("BRANCH_EQ_IMM",Kind.OneRegOneImmOneOff, 1, true),
  instruction("ADD",Kind.ThreeReg, 1),
  instruction("SHLO_L_IMM", Kind.TwoRegOneImm, 1),
  instruction("LOAD_U32", Kind.OneRegOneImm, 1),
  instruction("LOAD_IND_U8", Kind.TwoRegOneImm, 1),
  instruction("OR",Kind.ThreeReg, 1),
  instruction("STORE_IMM_IND_U32", Kind.OneRegTwoImm, 1),
  instruction("SHLO_R_IMM", Kind.TwoRegOneImm, 1),
  instruction("BRANCH_NE_IMM",Kind.OneRegOneImmOneOff, 1, true),
  instruction("STORE_IND_U8", Kind.TwoRegOneImm, 1),
  instruction("FALLTHROUGH", Kind.NoArgs, 1, true),
  instruction("AND_IMM", Kind.TwoRegOneImm, 1),
  instruction("JUMP_IND",Kind.OneRegOneImm, 1, true),
  instruction("SUB",Kind.ThreeReg, 1),
  instruction("LOAD_IND_I8", Kind.TwoRegOneImm, 1),
  instruction("STORE_U32",Kind.OneRegOneImm, 1),
  instruction("AND",Kind.ThreeReg, 1),
  instruction("BRANCH_EQ",Kind.TwoRegOneOff, 1, true),
  instruction("SHAR_R_IMM", Kind.TwoRegOneImm, 1),
  instruction("STORE_IMM_IND_U8", Kind.OneRegTwoImm, 1),
  instruction("SET_LT_U_IMM", Kind.TwoRegOneImm, 1),
  instruction("XOR",Kind.ThreeReg, 1),
  instruction("STORE_IND_U16", Kind.TwoRegOneImm, 1),
  instruction("BRANCH_NE",Kind.TwoRegOneOff, 1, true),
  instruction("XOR_IMM", Kind.TwoRegOneImm, 1),
  instruction("BRANCH_LT_S_IMM",Kind.OneRegOneImmOneOff, 1, true),
  instruction("LOAD_IND_I16", Kind.TwoRegOneImm, 1),
  instruction("MUL",Kind.ThreeReg, 1),
  instruction("MUL_IMM", Kind.TwoRegOneImm, 1),
  instruction("SET_LT_U",Kind.ThreeReg, 1),
  instruction("LOAD_IND_U16", Kind.TwoRegOneImm, 1),
  instruction("STORE_IMM_U32",Kind.TwoImm, 1),
  instruction("SET_GT_U_IMM", Kind.TwoRegOneImm, 1),
  instruction("NEG_ADD_IMM", Kind.TwoRegOneImm, 1),
  instruction("BRANCH_GE_U",Kind.TwoRegOneOff, 1, true),
  instruction("LOAD_IMM_JUMP_IND",Kind.TwoRegTwoImm, 1, true),
  instruction("BRANCH_GE_S",Kind.TwoRegOneOff, 1, true),
  instruction("BRANCH_LT_U_IMM",Kind.OneRegOneImmOneOff, 1, true),
  instruction("BRANCH_GE_S_IMM",Kind.OneRegOneImmOneOff, 1, true),
  instruction("BRANCH_LE_S_IMM",Kind.OneRegOneImmOneOff, 1, true),
  instruction("BRANCH_LT_U",Kind.TwoRegOneOff, 1, true),
  instruction("BRANCH_LT_S",Kind.TwoRegOneOff, 1, true),
  instruction("OR_IMM", Kind.TwoRegOneImm, 1),
  instruction("BRANCH_GT_U_IMM",Kind.OneRegOneImmOneOff, 1, true),
  instruction("SHLO_R",Kind.ThreeReg, 1),
  instruction("BRANCH_GE_U_IMM",Kind.OneRegOneImmOneOff, 1, true),
  instruction("BRANCH_GT_S_IMM",Kind.OneRegOneImmOneOff, 1, true),
  instruction("STORE_IMM_IND_U16", Kind.OneRegTwoImm, 1),
  instruction("SHLO_L",Kind.ThreeReg, 1),
  instruction("SET_LT_S_IMM", Kind.TwoRegOneImm, 1),
  instruction("MUL_UPPER_U_U",Kind.ThreeReg, 1),
  instruction("SET_LT_S",Kind.ThreeReg, 1),
  instruction("BRANCH_LE_U_IMM",Kind.OneRegOneImmOneOff, 1, true),
  instruction("LOAD_U8",Kind.OneRegOneImm, 1),
  instruction("SET_GT_S_IMM", Kind.TwoRegOneImm, 1),
  instruction("STORE_IMM_U8",Kind.TwoImm, 1),
  instruction("MUL_UPPER_U_U_IMM", Kind.TwoRegOneImm, 1),
  instruction("DIV_S",Kind.ThreeReg, 1),
  instruction("MUL_UPPER_S_S_IMM", Kind.TwoRegOneImm, 1),
  instruction("LOAD_I16",Kind.OneRegOneImm, 1),
  instruction("MUL_UPPER_S_S",Kind.ThreeReg, 1),
  instruction("DIV_U",Kind.ThreeReg, 1),
  instruction("STORE_U16",Kind.OneRegOneImm, 1),
  instruction("REM_S",Kind.ThreeReg, 1),
  instruction("STORE_U8",Kind.OneRegOneImm, 1),
  instruction("SHLO_R_IMM_ALT", Kind.TwoRegOneImm, 1),
  instruction("REM_U",Kind.ThreeReg, 1),
  instruction("LOAD_I8",Kind.OneRegOneImm, 1),
  instruction("SHLO_L_IMM_ALT", Kind.TwoRegOneImm, 1),
  instruction("LOAD_U16",Kind.OneRegOneImm, 1),
  instruction("SHAR_R",Kind.ThreeReg, 1),
  instruction("ECALLI",Kind.OneImm, 1),
  instruction("STORE_IMM_U16",Kind.TwoImm, 1),
  instruction("SHAR_R_IMM_ALT", Kind.TwoRegOneImm, 1),
  instruction("MUL_UPPER_S_U",Kind.ThreeReg, 1),
  instruction("MOVE_REG",Kind.TwoReg, 1),
  instruction("CMOV_IZ",Kind.ThreeReg, 1),
  instruction("CMOV_NZ",Kind.ThreeReg, 1),
  instruction("CMOV_IZ_IMM", Kind.TwoRegOneImm, 1),
  instruction("CMOV_NZ_IMM", Kind.TwoRegOneImm, 1),
  instruction("SBRK",Kind.TwoReg, 1),
];
