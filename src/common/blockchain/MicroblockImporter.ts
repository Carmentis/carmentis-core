import {CHAIN, SCHEMAS} from "../constants/constants";
import {SchemaUnserializer} from "../data/schemaSerializer";
import {Account} from "./Account";
import {ValidatorNode} from "./ValidatorNode";
import {Organization} from "./Organization";
import {Application} from "./Application";
import {ApplicationLedger} from "./ApplicationLedger";
import {Provider} from "../providers/Provider";
import {Crypto} from "../crypto/crypto";
import {Utils} from "../utils/utils";
import {CryptoSchemeFactory} from "../crypto/CryptoSchemeFactory";
import {Microblock} from "./Microblock";
import {VirtualBlockchain} from "./VirtualBlockchain";
import {Optional} from "../entities/Optional";

const OBJECT_CLASSES = [
    Account,
    ValidatorNode,
    Organization,
    Application,
    ApplicationLedger
];

export class MicroblockImporter {
    bodyData: any;
    _error: Optional<Error> = Optional.none();
    hash: any;
    header: any;
    headerData: any;
    provider: Provider;
    // @ts-ignore Add an initial value to the vb (possibly undefined).
    vb: VirtualBlockchain<any>;
    object: any;

    constructor({
        data,
        provider
    }: any) {
        this.provider = provider;
        this.headerData = data.slice(0, SCHEMAS.MICROBLOCK_HEADER_SIZE);
        this.bodyData = data.slice(SCHEMAS.MICROBLOCK_HEADER_SIZE);
        this.hash = Crypto.Hashes.sha256AsBinary(this.headerData);
    }

    containsError() {
        return this._error.isSome();
    }

    getError() {
        return this._error.unwrap();
    }

    get error(): string {
        if (this.containsError()) {
            return this.getError().toString();
        } else {
            return '';
        }
    }

    private setErrorFromErrorMessage(errorMessage: string) {
        this._error = Optional.some(new Error(errorMessage));
    }

    getVirtualBlockchainObject<VB>() {
        return this.object as VB
    }

    getMicroBlock(): Microblock {
        const mb = this.vb.currentMicroblock;
        if (mb === null) throw new Error("Cannot return null microblock.");
        return mb;
    }

    /**
     * Validates a micro block based on the given timestamp.
     *
     * @param {number} [currentTimestamp] - An optional timestamp to use for validation.
     * @return {Promise<boolean>} A promise that resolves to a boolean indicating whether the micro block is valid.
     */
    async isValidMicroBlock(currentTimestamp?: number): Promise<boolean> {
        const verificationResult = await this.checkAll(currentTimestamp);
        return verificationResult === 0;
    }

    /**
     * Retrieves the virtual blockchain instance associated with the current context.
     *
     * @template VB - The type of the virtual blockchain.
     * @return {Promise<VB>} A promise that resolves to the virtual blockchain instance.
     */
    async getVirtualBlockchain<VB>() {
        if (!this.vb) throw new Error("Cannot return vb: undefined vb");
        return this.vb as VB
    }

    async checkAll(currentTimestamp?: number) {
        return (
            (await this.checkHeader()) ||
            (await this.checkTimestamp(currentTimestamp)) ||
            (await this.instantiateVirtualBlockchain()) ||
            (await this.importMicroblock()) ||
            (await this.checkGas())
        );
    }

    /**
     * Checks the consistency of the serialized header, the magic string and the protocol version.
     */
    async checkHeader() {
        try {
            const headerUnserializer = new SchemaUnserializer(SCHEMAS.MICROBLOCK_HEADER);
            this.header = headerUnserializer.unserialize(this.headerData);

            if(this.header.magicString != CHAIN.MAGIC_STRING) {
                this.setErrorFromErrorMessage(`magic string '${CHAIN.MAGIC_STRING}' is missing`);
                return CHAIN.MB_STATUS_UNRECOVERABLE_ERROR
            }
            if(this.header.protocolVersion != CHAIN.PROTOCOL_VERSION) {
                this.setErrorFromErrorMessage(`invalid protocol version (expected ${CHAIN.PROTOCOL_VERSION}, got ${this.header.protocolVersion})`);
                return CHAIN.MB_STATUS_UNRECOVERABLE_ERROR
            }
        }
        catch(error) {
            this.setErrorFromErrorMessage(`invalid header format (${error})`);
            return CHAIN.MB_STATUS_UNRECOVERABLE_ERROR;
        }
        return 0;
    }

    /**
     * Checks the timestamp declared in the header.
     */
    async checkTimestamp(currentTimestamp?: number) {
        currentTimestamp = currentTimestamp || Utils.getTimestampInSeconds();

        if(this.header.timestamp < currentTimestamp - CHAIN.MAX_MICROBLOCK_PAST_DELAY) {
            this.setErrorFromErrorMessage(`timestamp is too far in the past`);
            return CHAIN.MB_STATUS_TIMESTAMP_ERROR;
        }
        if(this.header.timestamp > currentTimestamp + CHAIN.MAX_MICROBLOCK_FUTURE_DELAY) {
            this.setErrorFromErrorMessage(`timestamp is too far in the future`);
            return CHAIN.MB_STATUS_TIMESTAMP_ERROR;
        }
        return 0;
    }

    /**
     * First checks the body hash declared in the header, the existence of the previous microblock (if any) and the microblock height.
     * Then instantiates a virtual blockchain of the relevant type.
     */
    async instantiateVirtualBlockchain() {
        try {
            // check the body hash
            const hashScheme = CryptoSchemeFactory.createDefaultCryptographicHash();
            const bodyHash = hashScheme.hash(this.bodyData);

            if(!Utils.binaryIsEqual(bodyHash, this.header.bodyHash)) {
                this.setErrorFromErrorMessage(`inconsistent body hash`);
                return CHAIN.MB_STATUS_UNRECOVERABLE_ERROR;
            }

            // check the previous microblock, or get the type from the leading byte of the previousHash field if genesis
            let type;
            let expirationDay = 0;
            let vbIdentifier = new Uint8Array();

            if(this.header.height > 1) {
                const previousMicroblockInfo = await this.provider.getMicroblockInformation(this.header.previousHash);

                if(!previousMicroblockInfo) {
                    this.setErrorFromErrorMessage(`previous microblock ${Utils.binaryToHexa(this.header.previousHash)} not found`);
                    return CHAIN.MB_STATUS_PREVIOUS_HASH_ERROR;
                }

                const headerUnserializer = new SchemaUnserializer(SCHEMAS.MICROBLOCK_HEADER);
                const previousHeader = headerUnserializer.unserialize(previousMicroblockInfo.header);

                // @ts-expect-error TS(2339): Property 'height' does not exist on type '{}'.
                if(this.header.height != previousHeader.height + 1) {
                    // @ts-expect-error TS(2339): Property 'height' does not exist on type '{}'.
                    this._error = `inconsistent microblock height (expected ${previousHeader.height + 1}, got ${this.header.height})`;
                    return CHAIN.MB_STATUS_UNRECOVERABLE_ERROR;
                }

                type = previousMicroblockInfo.virtualBlockchainType;
                vbIdentifier = previousMicroblockInfo.virtualBlockchainId;
            }
            else {
                // extract the type and the expiration day from the special previousHash field
                type = this.header.previousHash[0];

                expirationDay =
                    this.header.previousHash[1] << 24 |
                    this.header.previousHash[2] << 16 |
                    this.header.previousHash[3] << 8 |
                    this.header.previousHash[4];
            }

            // attempt to instantiate the VB class
            const objectClass = OBJECT_CLASSES[type];

            if(!objectClass) {
                this.setErrorFromErrorMessage(`invalid virtual blockchain type ${type}`);
                return CHAIN.MB_STATUS_UNRECOVERABLE_ERROR;
            }

            this.object = new objectClass({ provider: this.provider });
            this.vb = this.object.vb;

            // if the VB exists ...
            if(this.header.height > 1) {
                // ... load it
                await this.vb.load(vbIdentifier);
            }
            else {
                // otherwise, set its expiration day
                this.vb.setExpirationDay(expirationDay);
            }
        }
        catch(error) {
            // @ts-expect-error TS(2571): Object is of type 'unknown'.
            this._error = error.toString();
            return CHAIN.MB_STATUS_UNRECOVERABLE_ERROR;
        }
        return 0;
    }

    /**
     * attempts to import the microblock (which includes the state update).
     */
    async importMicroblock() {
        try {
            // attempt to import the microblock
            await this.vb.importMicroblock(this.headerData, this.bodyData);
        }
        catch(error) {
            // @ts-expect-error TS(2571): Object is of type 'unknown'.
            this._error = error.toString();
            return CHAIN.MB_STATUS_UNRECOVERABLE_ERROR;
        }
        return 0;
    }

    /**
     * verifies that the declared gas matches the computed gas.
     */
    async checkGas() {
        try {
            // check the gas
            const mb = this.getMicroBlock();
            const declaredGas = mb.header.gas;
            const expectedGas = mb.computeGas();

            if(declaredGas != expectedGas) {
                this.setErrorFromErrorMessage(`inconsistent gas value in microblock header (expected ${expectedGas}, got ${declaredGas})`);
                return CHAIN.MB_STATUS_UNRECOVERABLE_ERROR;
            }
        }
        catch(error) {
            // @ts-expect-error TS(2571): Object is of type 'unknown'.
            this._error = error.toString();
            return CHAIN.MB_STATUS_UNRECOVERABLE_ERROR;
        }
        return 0;
    }

    /**
     * stores the microblock and update the VB state in the internal provider.
     */
    async store() {
        await this.provider.storeMicroblock(this.hash, this.vb.identifier, this.vb.type, this.vb.height, this.headerData, this.bodyData);
        await this.provider.updateVirtualBlockchainState(this.vb.identifier, this.vb.type, this.vb.expirationDay, this.vb.height, this.hash, this.vb.state);
    }
}
