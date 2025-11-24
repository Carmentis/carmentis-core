import {Microblock} from "./Microblock";
import {VirtualBlockchain} from "../virtualBlockchains/VirtualBlockchain";
import {Provider} from "../../providers/Provider";
import {Utils} from "../../utils/utils";
import {CryptoSchemeFactory} from "../../crypto/CryptoSchemeFactory";
import {VirtualBlockchainType} from "../../type/VirtualBlockchainType";
import {OrganizationVb} from "../virtualBlockchains/OrganizationVb";
import {AccountVb} from "../virtualBlockchains/AccountVb";
import {ApplicationVb} from "../virtualBlockchains/ApplicationVb";
import {ValidatorNodeVb} from "../virtualBlockchains/ValidatorNodeVb";
import {ProtocolVb} from "../virtualBlockchains/ProtocolVb";
import {ApplicationLedgerVb} from "../virtualBlockchains/ApplicationLedgerVb";
import {BlockchainSerializer} from "../../data/BlockchainSerializer";
import {TimestampValidationResult} from "./TimestampValidationResult";
import {MicroblockHeaderObject} from "../../type/types";
import {Optional} from "../../entities/Optional";
import {IllegalStateError} from "../../errors/carmentis-error";
import {Hash} from "../../entities/Hash";

type MicroblockCheckerState =
    { isMicroblockParsingCompleted: false } |
    {
        isMicroblockParsingCompleted: true,
        microblock: Microblock,
        virtualBlockchain: VirtualBlockchain,
    }
/**
 * This class is responsible for checking the validity of a microblock.
 * An improved version of MicroblockImporter with cleaner separation of concerns.
 */
export class MicroblockChecker {
    private _error: Optional<Error> = Optional.none();
    private hash!: Uint8Array;
    private headerData!: Uint8Array;
    private bodyData!: Uint8Array;
    private header!: MicroblockHeaderObject;
    private verificationState: MicroblockCheckerState = { isMicroblockParsingCompleted: false };

    constructor(
        private readonly provider: Provider,
        private readonly serializedMicroblock: Uint8Array
    ) {}

    async reconstructMicroblockAndVirtualBlockchainOrFail() {
        if (this.verificationState.isMicroblockParsingCompleted)
            throw new IllegalStateError("You have already called parseMicroblock() method. You can only call it once.")

        // Parse the serialized microblock into header and body
        const {serializedHeader, serializedBody} = BlockchainSerializer.unserializeMicroblockSerializedHeaderAndBody(
            this.serializedMicroblock
        );

        // Parse the header
        const header = BlockchainSerializer.unserializeMicroblockHeader(serializedHeader);

        // Validate body hash
        const hashScheme = CryptoSchemeFactory.createDefaultCryptographicHash();
        const bodyHash = hashScheme.hash(serializedBody);
        if (!Utils.binaryIsEqual(bodyHash, header.bodyHash)) {
            throw new Error(`inconsistent body hash`);
        }

        // Determine VB type and handle VB loading/creation
        let type: number;
        let expirationDay = 0;
        let vbIdentifier: Uint8Array = new Uint8Array();
        if (header.height > 1) {
            // Load existing VB
            const previousMicroblockInfo = await this.provider.getMicroblockInformation(header.previousHash);
            if (!previousMicroblockInfo) {
                throw new Error(`previous microblock ${Utils.binaryToHexa(header.previousHash)} not found`);
            }

            const previousHeader = BlockchainSerializer.unserializeMicroblockHeader(previousMicroblockInfo.header)
            if (header.height != previousHeader.height + 1) {
                throw new Error(`inconsistent microblock height (expected ${previousHeader.height + 1}, got ${header.height})`);
            }

            type = previousMicroblockInfo.virtualBlockchainType;
            vbIdentifier = previousMicroblockInfo.virtualBlockchainId;
        } else {
            // Genesis microblock - extract type and expiration day from previousHash field
            const genesisPreviousHash = header.previousHash;
            type = Microblock.extractTypeFromGenesisPreviousHash(genesisPreviousHash)
            expirationDay = Microblock.extractExpirationDayFromGenesisPreviousHash(genesisPreviousHash)
        }

        // parse the block
        const microblock = Microblock.loadFromSerializedHeaderAndBody(type, serializedHeader, serializedBody);

        // Instantiate the appropriate VB class
        let vb: VirtualBlockchain;
        const vbId = Hash.from(vbIdentifier)
        if (header.height > 1) {
            switch (type) {
                case VirtualBlockchainType.ORGANIZATION_VIRTUAL_BLOCKCHAIN:
                    vb = await this.provider.loadOrganizationVirtualBlockchain(vbId)
                    break;
                case VirtualBlockchainType.ACCOUNT_VIRTUAL_BLOCKCHAIN:
                    vb = await this.provider.loadAccountVirtualBlockchain(vbId)
                    break;
                case VirtualBlockchainType.APPLICATION_VIRTUAL_BLOCKCHAIN:
                    vb = await this.provider.loadApplicationVirtualBlockchain(vbId)
                    break;
                case VirtualBlockchainType.NODE_VIRTUAL_BLOCKCHAIN:
                    vb = await this.provider.loadValidatorNodeVirtualBlockchain(vbId)
                    break;
                case VirtualBlockchainType.PROTOCOL_VIRTUAL_BLOCKCHAIN:
                    vb = await this.provider.loadProtocolVirtualBlockchain(vbId)
                    break;
                case VirtualBlockchainType.APP_LEDGER_VIRTUAL_BLOCKCHAIN:
                    vb = await this.provider.loadApplicationLedgerVirtualBlockchain(vbId)
                    break;
                default:
                    throw new Error(`Unknown virtual blockchain type: ${type}`);
            }
        } else {
            switch (type) {
                case VirtualBlockchainType.ORGANIZATION_VIRTUAL_BLOCKCHAIN:
                    vb = new OrganizationVb(this.provider)
                    break;
                case VirtualBlockchainType.ACCOUNT_VIRTUAL_BLOCKCHAIN:
                    vb = new AccountVb(this.provider)
                    break;
                case VirtualBlockchainType.APPLICATION_VIRTUAL_BLOCKCHAIN:
                    vb = new ApplicationVb(this.provider)
                    break;
                case VirtualBlockchainType.NODE_VIRTUAL_BLOCKCHAIN:
                    vb = new ValidatorNodeVb(this.provider)
                    break;
                case VirtualBlockchainType.PROTOCOL_VIRTUAL_BLOCKCHAIN:
                    vb = new ProtocolVb(this.provider);
                    break;
                case VirtualBlockchainType.APP_LEDGER_VIRTUAL_BLOCKCHAIN:
                    vb = new ApplicationLedgerVb(this.provider);
                    break;
                default:
                    throw new Error(`Unknown virtual blockchain type: ${type}`);
            }
            vb.setExpirationDay(expirationDay);
        }

        // we finally update the state of the virtual blockchain by adding the parsed microblock inside the vb
        await vb.appendMicroBlock(microblock)

        this.verificationState = { isMicroblockParsingCompleted: true, microblock, virtualBlockchain: vb };
    }


    checkTimestampOrFail(currentTimestamp?: number) {
        if (this.verificationState.isMicroblockParsingCompleted === false)
            throw new IllegalStateError("You have already called reconstructMicroblockAndVirtualBlockchain() method. You can only call it once.")

        // check the microblock timestamp
        const microblock = this.verificationState.microblock;
        currentTimestamp = currentTimestamp || Utils.getTimestampInSeconds();
        const result = microblock.isTemporallyCloseTo(currentTimestamp);

        // raise an error if the timestamp is too far in the past
        if (result === TimestampValidationResult.TOO_FAR_IN_THE_PAST)
            throw new Error(`timestamp is too far in the past (header:${this.header.timestamp} / current:${currentTimestamp})`);

        if (result === TimestampValidationResult.TOO_FAR_IN_THE_FUTURE)
            throw new Error(`timestamp is too far in the future (header:${this.header.timestamp} / current:${currentTimestamp})`);

    }

    /**
     * Verifies that the declared gas matches the computed gas.
     */
    checkGasOrFail(): void {
        if (this.verificationState.isMicroblockParsingCompleted === false)
            throw new IllegalStateError("You have already called reconstructMicroblockAndVirtualBlockchain() method. You can only call it once.")

        const microblock = this.verificationState.microblock;
        const result = microblock.isDeclaringConsistentGas();
        if (result) {
            const expectedGas = microblock.computeGas().getAmountAsAtomic();
            const declaredGas = microblock.getGas().getAmountAsAtomic()
            throw new Error(`inconsistent gas value in microblock header (expected ${expectedGas}, got ${declaredGas})`)

        }
    }

    /**
     * Finalizes the verification by storing the microblock and updating the VB state.
     * This method incorporates the logic from the store() method of MicroblockImporter.
     */
    async finalize(): Promise<void> {
        const vbId = this.virtualBlockchain.getId();
        const vb = this.virtualBlockchain; // Cast to access private properties
        await this.provider.storeMicroblock(
            this.hash,
            vbId,
            vb.getType(),
            vb.getHeight(),
            this.headerData,
            this.bodyData
        );
        await this.provider.updateVirtualBlockchainState(
            vbId,
            vb.getType(),
            vb.getExpirationDay(),
            vb.getHeight(),
            this.hash,
            vb.getLocalState() as object
        );
    }

    private get virtualBlockchain() {
        if (this.verificationState.isMicroblockParsingCompleted) {
            return this.verificationState.virtualBlockchain
        } else {
            throw new IllegalStateError('Virtual blockchain not initialized.')
        }
    }

    private get microblock() {
        if (this.verificationState.isMicroblockParsingCompleted) {
            return this.verificationState.microblock
        } else {
            throw new IllegalStateError('Microblock not initialized.')
        }
    }

    /**
     * Get the virtual blockchain instance.
     */
    getVirtualBlockchain(): VirtualBlockchain {
        return this.virtualBlockchain;
    }

    /**
     * Get the microblock instance.
     */
    getMicroblock(): Microblock {
        return this.microblock;
    }

    /**
     * Get the microblock hash.
     */
    getHash(): Uint8Array {
        return this.hash;
    }

    /**
     * Get any error that occurred during processing.
     */
    getError(): Optional<Error> {
        return this._error;
    }

    /**
     * Check if there's an error.
     */
    containsError(): boolean {
        return this._error.isSome();
    }

    /**
     * Get error as string.
     */
    get error(): string {
        if (this.containsError()) {
            return this._error.unwrap().toString();
        } else {
            return '';
        }
    }
}