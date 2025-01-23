export * from "../common/common.js";
export * as web from "./web/web.js";

import * as network from "../common/network/network.js";
import * as browserNetworkInterface from "./network/browserNetworkInterface.js";

network.initialize(browserNetworkInterface);
