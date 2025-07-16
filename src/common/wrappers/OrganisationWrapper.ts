import {Organization} from "../blockchain/Organization";
import {OrganizationDescription} from "../blockchain/types";
import {PublicSignatureKey} from "../crypto/signature/signature-interface";

export class OrganisationWrapper {

    static async wrap(organisation: Organization) {
        const publicKey = await organisation.getPublicKey();
        const organisationDescription = await organisation.getDescription();
        return new OrganisationWrapper(publicKey, organisationDescription);
    }

    private constructor(
        private readonly publicKey: PublicSignatureKey,
        private readonly description: OrganizationDescription
    ) {}

    getCity() {
        return this.description.city;
    }

    getCountryCode() {
        return this.description.countryCode;
    }

    getWebsite(): string {
        return this.description.website;
    }

    getName() {
        return this.description.name;
    }

    getPublicKey() : PublicSignatureKey {
        return this.publicKey
    }
}