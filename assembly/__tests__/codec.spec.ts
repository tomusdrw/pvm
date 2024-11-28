import { readVarU32 } from "../codec";

describe("codec", () => {
  it("should read variable length values", () => {
    function test(data: u8[], value: u32, offset: usize): void {
      expect(readVarU32(data).value).toBe(value);
      expect(readVarU32(data).offset).toBe(offset);
    }

    test([127], 127, 1);
    test([191, 255], 2 ** 14 - 1, 2);
    test([192, 0, 0x40], 2 ** 14, 3);
    test([192 + 31, 0xff, 0xff], 2 ** 21 - 1, 3);
    test([0xe0, 0, 0, 0x20], 2 ** 21, 4);
    test([0xe0 + 15, 0xff, 0xff, 0xff], 2 ** 28 - 1, 4);
  });
});
