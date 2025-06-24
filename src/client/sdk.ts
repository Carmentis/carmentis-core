export * from "../common/common";
export * as web from "./web/web";
export { wiClient } from "./walletInterface/wiClient";
export { wiApplicationWallet } from "./walletInterface/wiApplicationWallet";
export { wiExtensionWallet } from "./walletInterface/wiExtensionWallet";

//import * as network from "../common/network/network.js";
import * as browserNetworkInterface from "./network/browserNetworkInterface.js";

//network.initialize(browserNetworkInterface);

import * as wiClientSocket from "./walletInterface/wiClientSocket.js";
import { io } from "./network/browserSocketInterface.js";

wiClientSocket.setIo(io);
