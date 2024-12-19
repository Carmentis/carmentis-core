import { DATA } from "../../constants/constants.js";

export const LIST = [
  {
    name: "INT",
    tests: [
      [ { type: DATA.INT }, 0, false ],
      [ { type: DATA.INT }, 123456789, false ],
      [ { type: DATA.INT }, -123456789, false ],
      [ { type: DATA.INT }, Number.MIN_SAFE_INTEGER, false ],
      [ { type: DATA.INT }, Number.MAX_SAFE_INTEGER, false ],
      [ { type: DATA.INT }, Number.MIN_SAFE_INTEGER - 1, true ],
      [ { type: DATA.INT }, Number.MAX_SAFE_INTEGER + 1, true ]
    ]
  },
  {
    name: "UINT",
    tests: [
      [ { type: DATA.UINT }, 0, false ],
      [ { type: DATA.UINT }, 123456789, false ],
      [ { type: DATA.UINT }, Number.MAX_SAFE_INTEGER, false ],
      [ { type: DATA.UINT }, -123456789, true ],
      [ { type: DATA.UINT }, -1, true ],
      [ { type: DATA.UINT }, Number.MAX_SAFE_INTEGER + 1, true ]
    ]
  },
  {
    name: "UINT8",
    tests: [
      [ { type: DATA.UINT8 }, 123, false ],
      [ { type: DATA.UINT8 }, 0xFF, false ],
      [ { type: DATA.UINT8 }, -1, true ],
      [ { type: DATA.UINT8 }, 0.1, true ],
      [ { type: DATA.UINT8 }, "foo", true ],
      [ { type: DATA.UINT8 }, 0x100, true ]
    ]
  },
  {
    name: "UINT16",
    tests: [
      [ { type: DATA.UINT16 }, 123, false ],
      [ { type: DATA.UINT16 }, 0xFFFF, false ],
      [ { type: DATA.UINT16 }, -1, true ],
      [ { type: DATA.UINT8 }, 0.1, true ],
      [ { type: DATA.UINT16 }, "foo", true ],
      [ { type: DATA.UINT16 }, 0x10000, true ]
    ]
  },
  {
    name: "UINT24",
    tests: [
      [ { type: DATA.UINT24 }, 123, false ],
      [ { type: DATA.UINT24 }, 0xFFFFFF, false ],
      [ { type: DATA.UINT24 }, -1, true ],
      [ { type: DATA.UINT8 }, 0.1, true ],
      [ { type: DATA.UINT24 }, "foo", true ],
      [ { type: DATA.UINT24 }, 0x1000000, true ]
    ]
  },
  {
    name: "UINT32",
    tests: [
      [ { type: DATA.UINT32 }, 123, false ],
      [ { type: DATA.UINT32 }, 0xFFFFFFFF, false ],
      [ { type: DATA.UINT32 }, -1, true ],
      [ { type: DATA.UINT8 }, 0.1, true ],
      [ { type: DATA.UINT32 }, "foo", true ],
      [ { type: DATA.UINT32 }, 0x100000000, true ]
    ]
  },
  {
    name: "STRING",
    tests: [
      [ { type: DATA.STRING }, "", false ],
      [ { type: DATA.STRING }, "hello!", false ],
      [ { type: DATA.STRING, size: 6 }, "hello!", false ],
      [ { type: DATA.STRING }, "Ûnicöde😊", false ],
      [ { type: DATA.STRING, size: 5 }, "hello!", true ],
      [ { type: DATA.STRING }, 123, true ]
    ]
  },
  {
    name: "DECIMAL",
    tests: [
    ]
  },
  {
    name: "AMOUNT",
    tests: [
    ]
  },
  {
    name: "TIMESTAMP",
    tests: [
    ]
  },
  {
    name: "DATE",
    tests: [
    ]
  },
  {
    name: "FILE",
    tests: [
    ]
  },
  {
    name: "BINARY",
    tests: [
      [ { type: DATA.BINARY }, new Uint8Array(), false ],
      [ { type: DATA.BINARY }, new Uint8Array([1]), false ],
      [ { type: DATA.BINARY }, new Uint8Array([1, 2, 3]), false ],
      [ { type: DATA.BINARY }, new Uint8Array([...Array(200).keys()]), false ],
      [ { type: DATA.BINARY }, [1,2,3], true ],
      [ { type: DATA.BINARY }, "foo", true ]
    ]
  },
  {
    name: "BIN128",
    tests: [
      [ { type: DATA.BIN128 }, new Uint8Array(16), false ],
      [ { type: DATA.BIN128 }, new Uint8Array(), true ],
      [ { type: DATA.BIN128 }, new Uint8Array([1, 2, 3]), true ],
      [ { type: DATA.BIN128 }, "foo", true ]
    ]
  },
  {
    name: "BIN256",
    tests: [
      [ { type: DATA.BIN256 }, new Uint8Array(32), false ],
      [ { type: DATA.BIN256 }, new Uint8Array(), true ],
      [ { type: DATA.BIN256 }, new Uint8Array([1, 2, 3]), true ],
      [ { type: DATA.BIN256 }, "foo", true ]
    ]
  },
  {
    name: "BIN264",
    tests: [
      [ { type: DATA.BIN264 }, new Uint8Array(33), false ],
      [ { type: DATA.BIN264 }, new Uint8Array(), true ],
      [ { type: DATA.BIN264 }, new Uint8Array([1, 2, 3]), true ],
      [ { type: DATA.BIN264 }, "foo", true ]
    ]
  },
  {
    name: "BIN512",
    tests: [
      [ { type: DATA.BIN512 }, new Uint8Array(64), false ],
      [ { type: DATA.BIN512 }, new Uint8Array(), true ],
      [ { type: DATA.BIN512 }, new Uint8Array([1, 2, 3]), true ],
      [ { type: DATA.BIN512 }, "foo", true ]
    ]
  }
];
