export * from "../common/common";
export { wiServer } from "./walletInterface/wiServer";

import * as network from "../common/network/network";
// @ts-expect-error TS(2306): File '/home/gael/Documents/git/carmentis/carmentis... Remove this comment to see the full error message
import * as nodeJsNetworkInterface from "./network/nodeJsNetworkInterface";

network.initialize(nodeJsNetworkInterface);
