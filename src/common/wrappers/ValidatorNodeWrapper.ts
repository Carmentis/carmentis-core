import {ValidatorNode} from "../blockchain/ValidatorNode";
import {Hash} from "../entities/Hash";
import {ValidatorNodeDescription} from "../blockchain/types";

export class ValidatorNodeWrapper {
    static async wrap(validatorNode: ValidatorNode) {
        const declaration = await validatorNode.getDeclaration();
        const organizationId = Hash.from(declaration.organizationId);
        const description =  await validatorNode.getDescription();
        return new ValidatorNodeWrapper(organizationId, description);
    }

    private constructor(
        private readonly organizationId: Hash,
        private readonly description: ValidatorNodeDescription
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
    getPower(): number {
        return this.description.power;
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
}