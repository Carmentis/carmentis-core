import {MicroBlockHeaderInterface} from "./MicroBlockHeaderInterface";
import {MicroBlockHeader} from "./MicroBlockHeader";
import {Hash, CMTSToken, VirtualBlockchainStateInterface} from "../common";
import {VirtualBlockchainState} from "./VirtualBlockchainState";
import {MicroBlockInformation} from "./MicroBlockInformation";
import {VirtualBlockchainUpdate} from "./VirtualBlockchainUpdate";

export class NodeTranslator {
    static translateMicroBlockHeader(header: MicroBlockHeaderInterface): MicroBlockHeader {
        return new class extends MicroBlockHeader {
            getBodyHash = () => Hash.from(header.bodyHash);
            getGas = () => CMTSToken.createAtomic(header.gas)
            getGasPrice = () => CMTSToken.createAtomic(header.gasPrice);
            getHeight = () => header.height;
            getMagicString = () => header.magicString;
            getPreviousHash = () => Hash.from(header.previousHash);
            getProtocolVersion = () => header.protocolVersion;
        };
    }

    static translateMicroBlockInformation(header: MicroBlockHeader, state: VirtualBlockchainState) {
        return new class extends MicroBlockInformation {
            getMicroBlockHeader(): MicroBlockHeader {
                return header;
            }
            getVirtualBlockchainState(): VirtualBlockchainState {
                return state;
            }
        }
    }

    static translateVirtualBlockchainState(vbId: Hash, state: VirtualBlockchainStateInterface): VirtualBlockchainState {
        return new class extends VirtualBlockchainState {
            getLastMicroblockHash = () => Hash.from(state.lastMicroblockHash)
            getType = () => state.type;
            getHeight = () => state.height;
            getVbId = () => vbId
        }
    }

    static translateVirtualBlockchainUpdate(state: VirtualBlockchainState, headers: MicroBlockHeader[]): VirtualBlockchainUpdate {
        return new class extends VirtualBlockchainUpdate {
            getVirtualBlockchainState = () => state
            getMicroBlockHeaders = () => headers
        }
    }
 }