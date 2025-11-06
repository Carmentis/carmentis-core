import {Organization} from "../blockchain/Organization";
import {OrganizationDescription} from "../blockchain/types";

import {PublicSignatureKey} from "../crypto/signature/PublicSignatureKey";

export class OrganizationWrapper {

    static async wrap(organization: Organization) {
        const publicKey = await organization.getPublicKey();
        const organizationDescription = await organization.getDescription();
        return new OrganizationWrapper(publicKey, organizationDescription);
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