import {ValidatorNode} from "../blockchain/ValidatorNode";
import {Hash} from "../entities/Hash";
import {CometBFTPublicKey} from "../cometbft/CometBFTPublicKey";
import {
    ValidatorNodeDescriptionSection,
    ValidatorNodeVotingPowerUpdateSection,
    ValidatorNodeRpcEndpointSection
} from "../blockchain/sectionSchemas";

export class ValidatorNodeWrapper {
    static async wrap(validatorNode: ValidatorNode) {
        const declaration = await validatorNode.getDeclaration();
        const organizationId = Hash.from(declaration.organizationId);
        const description = await validatorNode.getDescription();
        const rpcEndpoint = await validatorNode.getRpcEndpoint();
        const networkIntegration = await validatorNode.getNetworkIntegration();
        return new ValidatorNodeWrapper(organizationId, description, rpcEndpoint, networkIntegration);
    }

    private constructor(
        private readonly organizationId: Hash,
        private readonly description: ValidatorNodeDescriptionSection,
        private readonly rpcEndpoint: ValidatorNodeRpcEndpointSection,
        private readonly networkIntegration: ValidatorNodeVotingPowerUpdateSection
    ) {}

    /**
     * Retrieves the id of the organization managing the validator node.
     *
     * @return {Hash} The organization ID managing the validator node.
     */
    getOrganizationId(): Hash {
        return this.organizationId;
    }

    /**
     * Retrieves the voting power of the validator node
     *
     * @return {number} The voting power of the validator node.
     */
    getVotingPower(): number {
        return this.networkIntegration.votingPower;
    }

    /**
     * Retrieves the RPC endpoint of the validator node
     *
     * @return {number} The RPC endpoint of the validator node.
     */
    getRpcEndpoint(): string {
        return this.rpcEndpoint.rpcEndpoint;
    }

    /**
     * Retrieves the Comet public key type of the validator node.
     * @return {string} Comet public key type of the validator node.
     */
    getCometPublicKeyType() {
        return this.description.cometPublicKeyType;
    }

    /**
     * Retrieves the Comet public key of the validator node.
     * @return {string} Comet public key of the validator node.
     */
    getCometPublicKey() {
        return this.description.cometPublicKey;
    }

    /**
     * Retrieves the public key associated with the CometBFT instance.
     *
     * @return {CometBFTPublicKey} The public key created from the Ed25519 public key.
     */
    getPublicKey(): CometBFTPublicKey {
        return CometBFTPublicKey.createFromEd25519PublicKey(this.description.cometPublicKey);
    }
}