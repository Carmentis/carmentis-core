import {PublicationExecutionContext} from "./PublicationExecutionContext";
import {Optional} from "../../entities/Optional";
import {Hash} from "../../entities/Hash";

export class ValidatorNodeNetworkIntegrationPublicationExecutionContext extends PublicationExecutionContext {
    private validatorNodeId: Optional<Hash> = Optional.none();
    private votingPower: number = 0;

    withVotingPower(votingPower: number): ValidatorNodeNetworkIntegrationPublicationExecutionContext {
        this.votingPower = votingPower;
        return this;
    }

    build() {
        return {
            validatorNodeId: this.validatorNodeId,
            votingPower: this.votingPower
        };
    }
}
