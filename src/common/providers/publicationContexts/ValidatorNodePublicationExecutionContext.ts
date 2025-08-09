import {PublicationExecutionContext} from "./PublicationExecutionContext";
import {Optional} from "../../entities/Optional";
import {Hash} from "../../entities/Hash";

export class ValidatorNodePublicationExecutionContext extends PublicationExecutionContext {
    private validatorNodeId: Optional<Hash> = Optional.none();
    private organizationId: Optional<Hash> = Optional.none();
    private cometPublicKeyType: string = "";
    private cometPublicKey: string = "";

    withCometPublicKeyType(cometPublicKeyType: string): ValidatorNodePublicationExecutionContext {
        this.cometPublicKeyType = cometPublicKeyType;
        return this;
    }

    withCometPublicKey(cometPublicKey: string): ValidatorNodePublicationExecutionContext {
        this.cometPublicKey = cometPublicKey;
        return this;
    }

    withOrganizationId(organizationId: Hash) {
        this.organizationId = Optional.some(organizationId);
        return this;
    }

    build() {
        return {
            organizationId: this.organizationId,
            validatorNodeId: this.validatorNodeId,
            cometPublicKeyType: this.cometPublicKeyType,
            cometPublicKey: this.cometPublicKey
        };
    }
}
