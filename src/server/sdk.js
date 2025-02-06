export * from "../common/common.js";
export * as nodeCore from "./node/node-core.js";
export * as operatorCore from "./operator/operator-core.js";
export { wiServer } from "./walletInterface/wiServer.js";

import * as network from "../common/network/network.js";
import * as nodeJsNetworkInterface from "./network/nodeJsNetworkInterface.js";

network.initialize(nodeJsNetworkInterface);
