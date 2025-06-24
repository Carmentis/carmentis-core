// @ts-expect-error TS(2307): Cannot find module './virtualBlockchain.js' or its... Remove this comment to see the full error message
import { VirtualBlockchain } from "./virtualBlockchain";
// @ts-expect-error TS(2307): Cannot find module '../intermediateRepresentation.... Remove this comment to see the full error message
import { IntermediateRepresentation } from "../intermediateRepresentation";
// @ts-expect-error TS(2307): Cannot find module '../messageManager.js' or its c... Remove this comment to see the full error message
import { MessageManager } from "../messageManager";

export class ApplicationLedger extends VirtualBlockchain {
  async encodeMessage(msg: any) {
    const res = await MessageManager.encode(msg, this.irLoader);

    return res;
  }

  async decodeMessage(msg: any) {
    const res = await MessageManager.decode(msg, this.irLoader);

    return res;
  }

  irLoader(n: any) {
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
