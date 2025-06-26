import { ApplicationVb } from "./applicationVb";
import { Crypto } from "../crypto/crypto";
import {ApplicationDescription, Hash} from "./types";
import {Provider} from "../providers/provider";

export class Application {
    provider: any;
    signatureAlgorithmId: any;
    vb: ApplicationVb;
    gasPrice: number;

    constructor({
                    provider
                }: { provider: Provider }) {
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

    async setDescription(object: ApplicationDescription) {
        await this.vb.setDescription(object);
    }

    setGasPrice(gasPrice: number) {
        this.gasPrice = gasPrice;
    }

    async getDescription() {
        return this.vb.getDescription();
    }

    async getOrganizationId() {
        const declaration = await this.vb.getDeclaration();
        return Hash.from(declaration.organizationId)
    }

    async getDeclaration() {
        return this.vb.getDeclaration();
    }


    async publishUpdates() {
        if (!this.provider.isKeyed()) throw 'Cannot publish updates without keyed provider.'
        const privateKey = this.provider.getPrivateSignatureKey();
        this.vb.setGasPrice(this.gasPrice);
        await this.vb.setSignature(privateKey);
        return await this.vb.publish();
    }
}
