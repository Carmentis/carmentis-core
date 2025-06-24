export * from "../common/common.js";
export { wiServer } from "./walletInterface/wiServer.js";

import * as network from "../common/network/network.js";
import * as nodeJsNetworkInterface from "./network/nodeJsNetworkInterface";

network.initialize(nodeJsNetworkInterface);
