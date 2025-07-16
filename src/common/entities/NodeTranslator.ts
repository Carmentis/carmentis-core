import {MicroBlockHeaderInterface} from "./MicroBlockHeaderInterface";
import {AbstractMicroBlockHeader} from "./AbstractMicroBlockHeader";
import {VirtualBlockchainState} from "./VirtualBlockchainState";
import {MicroBlockInformation} from "./MicroBlockInformation";
import {VirtualBlockchainUpdate} from "./VirtualBlockchainUpdate";
import {Hash} from "./Hash";
import {CMTSToken} from "../economics/currencies/token";
import {VirtualBlockchainStateInterface} from "../blockchain/types";

export class NodeTranslator {
    static translateMicroBlockHeader(header: MicroBlockHeaderInterface): AbstractMicroBlockHeader {
        return new class extends AbstractMicroBlockHeader {
            getBodyHash = () => Hash.from(header.bodyHash);
            getGas = () => CMTSToken.createAtomic(header.gas)
            getGasPrice = () => CMTSToken.createAtomic(header.gasPrice);
            getHeight = () => header.height;
            getMagicString = () => header.magicString;
            getPreviousHash = () => Hash.from(header.previousHash);
            getProtocolVersion = () => header.protocolVersion;
        };
    }

    static translateMicroBlockInformation(header: AbstractMicroBlockHeader, state: VirtualBlockchainState) {
        return new class extends MicroBlockInformation {
            getMicroBlockHeader(): AbstractMicroBlockHeader {
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

    static translateVirtualBlockchainUpdate(state: VirtualBlockchainState, hashes: Hash[]): VirtualBlockchainUpdate {
        return new class extends VirtualBlockchainUpdate {
            getVirtualBlockchainState = () => state
            getMicroBlockHashes(): Hash[] {
                return hashes;
            }
        }
    }
 }