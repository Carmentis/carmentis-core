export * from "../common/common.js";
export * as nodeCore from "./node/node-core.js";

import * as network from "../common/network/network.js";
import * as nodeJsNetworkInterface from "./network/nodeJsNetworkInterface.js";
import * as nodeJsSocketInterface from "./network/nodeJsSocketInterface.js";

network.initialize(nodeJsNetworkInterface);
