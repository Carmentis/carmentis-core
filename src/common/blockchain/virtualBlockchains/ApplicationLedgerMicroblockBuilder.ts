import {ApplicationLedgerVb} from "./ApplicationLedgerVb";
import {ApplicationLedgerLocalState} from "../localStates/ApplicationLedgerLocalState";
import {AppLedgerStateUpdateRequest} from "../../type/AppLedgerStateUpdateRequest";
import {
    AbstractPrivateDecryptionKey,
    AbstractPublicEncryptionKey
} from "../../crypto/encryption/public-key-encryption/PublicKeyEncryptionSchemeInterface";
import {Microblock} from "../microblock/Microblock";
import {VirtualBlockchainType} from "../../type/VirtualBlockchainType";
import {SchemaValidator} from "../../data/schemaValidator";
import {Utils} from "../../utils/utils";
import {ActorType} from "../../constants/ActorType";
import {Crypto} from "../../crypto/crypto";
import {
    DecryptionError, IllegalParameterError,
    MicroBlockNotFoundInVirtualBlockchainAtHeightError, SharedKeyDecryptionError
} from "../../errors/carmentis-error";
import {SCHEMAS} from "../../constants/constants";
import {PublicSignatureKey} from "../../crypto/signature/PublicSignatureKey";
import {Assertion} from "../../utils/Assertion";
import {Logger} from "../../utils/Logger";
import {HKDF} from "../../crypto/kdf/HKDF";
import {AES256GCMSymmetricEncryptionKey} from "../../crypto/encryption/symmetric-encryption/encryption-interface";
import {IApplicationLedgerLocalStateUpdater} from "../localStates/ILocalStateUpdater";
import {LocalStateUpdaterFactory} from "../localStatesUpdater/LocalStateUpdaterFactory";
import {Section} from "../../type/Section";
import {IMicroblockSearchFailureFallback} from "./fallbacks/IMicroblockSearchFailureFallback";
import { Height } from "../../common";
import { VirtualBlockchain } from "./VirtualBlockchain";


export class ApplicationLedgerMicroblockBuilder implements IMicroblockSearchFailureFallback {

    private stateUpdater: IApplicationLedgerLocalStateUpdater;
    constructor(protected mbUnderConstruction: Microblock, protected vb: ApplicationLedgerVb) {
        this.stateUpdater = LocalStateUpdaterFactory.createApplicationLedgerLocalStateUpdater(
            mbUnderConstruction.getLocalStateUpdateVersion()
        );
    }

    onMicroblockSearchFailureForExceedingHeight(vb: VirtualBlockchain, askedHeight: Height): Promise<Microblock> {
        const currentVbHeight = vb.getHeight();
        if (currentVbHeight + 1 === askedHeight) return Promise.resolve(this.mbUnderConstruction);
        throw new MicroBlockNotFoundInVirtualBlockchainAtHeightError(vb.getIdentifier(), askedHeight)
    }

    protected getBuiltMicroblock() {
        return this.mbUnderConstruction;
    }

    protected async updateStateWithSection(section: Section) {
        this.vb.setLocalState(
            await this.stateUpdater.updateStateFromSection(
                this.vb.getLocalState(),
                section,
                this.mbUnderConstruction.getHeight()
            )
        )
    }

    protected getLocalState() {
        return this.vb.getLocalState();
    }


}
