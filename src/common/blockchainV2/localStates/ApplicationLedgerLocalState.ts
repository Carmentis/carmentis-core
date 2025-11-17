import {
    ApplicationLedgerActor,
    ApplicationLedgerActorCreationSection,
    ApplicationLedgerLocalStateObject
} from "../../blockchain/types";
import {Utils} from "../../utils/utils";

export class ApplicationLedgerLocalState {
    constructor(private localState: ApplicationLedgerLocalStateObject) {
    }

    static createFromLocalState(localState: ApplicationLedgerLocalStateObject) {
        return new ApplicationLedgerLocalState(localState);
    }


    static createInitialState() {
        return new ApplicationLedgerLocalState({
            actors: [],
            allowedPkeSchemeIds: [],
            allowedSignatureSchemeIds: [],
            applicationId: Utils.getNullHash(),
            channels: []
        })
    }

    createActor(createdActor: ApplicationLedgerActor) {
        this.localState.actors.push(createdActor);
    }
}