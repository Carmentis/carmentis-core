import { VirtualBlockchain } from "./virtualBlockchain.js";
import { IntermediateRepresentation } from "./intermediateRepresentation.js";
import { MessageManager } from "./messageManager.js";

export class AppLedger extends VirtualBlockchain {
  async encodeMessage(msg) {
    const res = await MessageManager.encode(msg, this.irLoader);

    return res;
  }

  async decodeMessage(msg) {
    const res = await MessageManager.decode(msg, this.irLoader);

    return res;
  }

  irLoader(n) {
    let ir = new IntermediateRepresentation;

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
