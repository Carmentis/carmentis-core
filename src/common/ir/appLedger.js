import { intermediateRepresentation } from "./intermediateRepresentation.js";
import { messageManager } from "./messageManager.js";

export class appLedger {
  async encodeMessage(msg) {
    const res = await messageManager.encode(msg, this.irLoader);

    return res;
  }

  async decodeMessage(msg) {
    const res = await messageManager.decode(msg, this.irLoader);

    return res;
  }

  irLoader(n) {
    let ir = new intermediateRepresentation;

    ir.buildFromJson({
      someString: "Hello, world!",
      email: "john.doe@gmail.com",
      someObject: {
        someStringProp: "As we travel the universe 🪐",
        someNumberArrayProp: [ 123, 456, 78.9 ],
        someObjectArrayProp: [ { name: "a" }, { name: "b" }, { name: "c" } ],
        someNullProp: null,
        someBooleanProp: true
      }
    });

    return ir.getIRObject();
  }
}
