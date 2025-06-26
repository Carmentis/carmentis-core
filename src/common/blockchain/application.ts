import { ApplicationVb } from "./applicationVb";
import { Crypto } from "../crypto/crypto";
import {Hash} from "./types";

export class Application {
    provider: any;
    signatureAlgorithmId: any;
    vb: ApplicationVb;
    gasPrice: number;

    constructor({
                    provider
                }: any) {
        this.vb = new ApplicationVb(provider);
        this.provider = provider;
        this.gasPrice = 0;

        if (this.provider.isKeyed()) {
            const privateKey = this.provider.getPrivateSignatureKey();
            this.signatureAlgorithmId = privateKey.getSignatureAlgorithmId();
        }
    }

    async _create(organizationId: any) {
        await this.vb.setSignatureAlgorithm({
            algorithmId: this.signatureAlgorithmId
        });

        await this.vb.setDeclaration({
            organizationId: organizationId
        });
    }

    async _load(identifier: any) {
        await this.vb.load(identifier);
    }

    async setDescription(object: any) {
        await this.vb.setDescription(object);
    }

    setGasPrice(gasPrice: number) {
        this.gasPrice = gasPrice;
    }

    getDescription() {
        throw 'Not implemented';
        //return this.vb.g
    }

    getName(): string {
        throw 'Not implemented'
        //return this.vb.state.name;
    }

    /**
     * Retrieves the unique identifier of the organization from the current state.
     *
     * @return {Hash} The hashed value representing the organization's unique identifier.
     */
    getOrganizationId() {
        throw 'Not implemented';
        //return Hash.from(this.vb.state.organizationId);
    }

    async publishUpdates() {
        if (!this.provider.isKeyed()) throw 'Cannot publish updates without keyed provider.'
        const privateKey = this.provider.getPrivateSignatureKey();
        this.vb.setGasPrice(this.gasPrice);
        await this.vb.setSignature(privateKey);
        return await this.vb.publish();
    }
}
