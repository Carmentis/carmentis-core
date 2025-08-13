import {RPCNodeStatusResponseType} from "./RPCNodeStatusResponseType";
import {CometBFTPublicKey} from "../../cometbft/CometBFTPublicKey";

export class NodeStatusWrapper {
    private constructor(private status: RPCNodeStatusResponseType) {}

    static fromStatus(status: RPCNodeStatusResponseType) {
        return new NodeStatusWrapper(status);
    }

    getChainId() {
        return this.getNodeInfo().network;
    }

    getNodeName() {
        return this.getNodeInfo().moniker;
    }

    isCatchingUp() {
        return this.getResponse().sync_info.catching_up;
    }

    getPublicKey() {
        const publicKey = this.getResponse().validator_info.pub_key;
        return CometBFTPublicKey.createFromEd25519PublicKey(publicKey.value);
    }

    getCometBFTVersion() {
        return this.getNodeInfo().version;
    }

    isValidator() {
        const votingPower = Number.parseInt(
            this.status.result.validator_info.voting_power
        );
        return votingPower !== 0;
    }

    getCometBFTNodePublicKey() {
        return this.status.result.validator_info.pub_key.value;
    }

    getRpcAddress() : string {
        return this.status.result.node_info.other.rpc_address;
    }


    getCometBFTNodePublicKeyType() {
        return this.status.result.validator_info.pub_key.type;
    }


    private getResponse() {
        return this.status.result;
    }

    private getNodeInfo() {
        return this.getResponse().node_info;
    }

}