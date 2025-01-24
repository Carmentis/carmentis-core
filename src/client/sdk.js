export * from "../common/common.js";
export * as web from "./web/web.js";
export * as wiClient from "./walletInterface/wiClient.js";

import * as network from "../common/network/network.js";
import * as browserNetworkInterface from "./network/browserNetworkInterface.js";

network.initialize(browserNetworkInterface);

import * as wiClientSocket from "./walletInterface/wiClientSocket.js";
import * as browserSocketInterface from "./network/browserSocketInterface.js";

wiClientSocket.setIo(browserSocketInterface);
