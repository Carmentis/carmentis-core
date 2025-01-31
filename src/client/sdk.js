export * from "../common/common.js";
export * as web from "./web/web.js";
export { wiClient } from "./walletInterface/wiClient.js";
export { wiApplicationWallet } from "./walletInterface/wiApplicationWallet.js";
export { wiExtensionWallet } from "./walletInterface/wiExtensionWallet.js";

import * as network from "../common/network/network.js";
import * as browserNetworkInterface from "./network/browserNetworkInterface.js";

network.initialize(browserNetworkInterface);

import * as wiClientSocket from "./walletInterface/wiClientSocket.js";
import { io } from "./network/browserSocketInterface.js";

wiClientSocket.setIo(io);
