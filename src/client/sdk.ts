export * from "../common/common";
export * as web from "./web/web";
export { wiClient } from "./walletInterface/wiClient";
export { wiApplicationWallet } from "./walletInterface/wiApplicationWallet";
export { wiExtensionWallet } from "./walletInterface/wiExtensionWallet";


import * as wiClientSocket from "./walletInterface/wiClientSocket";
import { io } from "./network/browserSocketInterface";

wiClientSocket.setIo(io);
