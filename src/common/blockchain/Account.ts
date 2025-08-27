import {ECO} from "../constants/constants";
import {AccountVb} from "./AccountVb";
import {Utils} from "../utils/utils";
import {PrivateSignatureKey, PublicSignatureKey} from "../crypto/signature/signature-interface";
import {EncoderFactory} from "../utils/encoder";
import {AccountTransfer} from "./types";
import {CryptoSchemeFactory} from "../crypto/CryptoSchemeFactory";
import {Provider} from "../providers/Provider";
import {CMTSToken} from "../economics/currencies/token";
import {IllegalParameterError, IllegalStateError} from "../errors/carmentis-error";
import {Hash} from "../entities/Hash";

/**
 * Represents an Account that interacts with a provider for managing cryptographic operations
 * and interacting with a virtual blockchain (vb) context. Provides methods for creating,
 * loading, transferring, and publishing updates.
 */
export class Account {
    vb: AccountVb;
    provider: Provider;
    gasPrice: CMTSToken;

    constructor({provider}: {provider: Provider}) {
        this.vb = new AccountVb({ provider });
        this.provider = provider;
        this.gasPrice = CMTSToken.zero();
    }

    async _createGenesis(genesisPublicKey?: PublicSignatureKey) {
        // we need a public key to create the genesis account, so we raise an exception if
        // both the provider and the default public key are undefined
        const isUnkeyed = !this.provider.isKeyed();
        const undefinedGenesisPublicKey = genesisPublicKey === undefined;
        if (isUnkeyed && undefinedGenesisPublicKey) {
            throw new IllegalStateError("Cannot create a genesis account without a keyed provider or default public key.")
        }

        // we use in priority the default public key, if provided, or the keyed provider's public key
        const publicKey = genesisPublicKey || this.getPrivateSignatureKey().getPublicKey();
        await this.vb.setSignatureAlgorithm({
            algorithmId: this.getSignatureAlgorithmId()
        });
        await this.vb.setPublicKey(publicKey);
        await this.vb.setTokenIssuance({
            amount: ECO.INITIAL_OFFER
        });

    }

    /**
     *
     * @param {Uint8Array} sellerAccount
     * @param {PublicSignatureKey} buyerPublicKey
     * @param {number} amount
     * @returns {Promise<void>}
     * @private
     */
    async _create(sellerAccount: Uint8Array, buyerPublicKey: PublicSignatureKey, amount: number) {
        if (!this.provider.isKeyed()) throw new IllegalStateError("Cannot create an account without a keyed provider.")
        await this.vb.setSignatureAlgorithm({
            algorithmId: this.getSignatureAlgorithmId()
        });

        await this.vb.setPublicKey(buyerPublicKey);

        await this.vb.setCreation({
            sellerAccount: sellerAccount,
            amount: amount
        });
    }

    async _load(identifier: Uint8Array) {
        await this.vb.load(identifier);
    }

    /**
     * Retrieves the public key for the current instance of the cryptographic context.
     *
     * The method fetches the raw public key and the signature algorithm ID, then utilizes the CryptoSchemeFactory
     * to create and return a public signature key object.
     *
     * @return {Promise<PublicSignatureKey>} A promise that resolves to a public signature key object.
     */
    async getPublicKey() {
        const rawPublicKey = await this.vb.getPublicKey();
        const algorithmId = await this.vb.getSignatureAlgorithmId();
        const factory = new CryptoSchemeFactory();
        return factory.createPublicSignatureKey(algorithmId, rawPublicKey);
    }

    async transfer(object: AccountTransfer) {
        await this.vb.setTransfer({
            account: object.account,
            amount: object.amount,
            publicReference: object.publicReference,
            privateReference: object.privateReference
        });
    }

    setGasPrice(gasPrice: CMTSToken) {
        this.gasPrice = gasPrice;
    }

    async publishUpdates() {
        if (this.provider.isKeyed()) {
            this.vb.setGasPrice(this.gasPrice);
            await this.vb.setSignature(this.getPrivateSignatureKey());
            return await this.vb.publish();
        } else {
            throw new IllegalStateError("Cannot publish updates without a keyed provider.");
        }

    }

    private getSignatureAlgorithmId() {
        if (this.provider.isKeyed()) {
            return this.getPrivateSignatureKey().getSignatureAlgorithmId();
        } else {
            throw new IllegalStateError("Cannot get signature algorithm ID without a keyed provider.")
        }
    }

    private getPrivateSignatureKey() {
        if (this.provider.isKeyed()) {
            return this.provider.getPrivateSignatureKey();
        } else {
            throw new IllegalStateError("Cannot get private signature key without a keyed provider.")
        }
    }

    getVirtualBlockchainId() {
        return Hash.from(this.vb.identifier);
    }
}
