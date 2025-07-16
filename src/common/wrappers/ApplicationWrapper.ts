import {Application} from "../blockchain/Application";
import {Hash} from "../entities/Hash";
import {ApplicationDescription} from "../blockchain/types";

export class ApplicationWrapper {
    static async wrap(application: Application) {
        const declaration = await application.getDeclaration();
        const organisationId = Hash.from(declaration.organizationId);
        const description =  await application.getDescription();
        return new ApplicationWrapper(organisationId, description);
    }

    private constructor(
        private readonly organisationId: Hash,
        private readonly description: ApplicationDescription
    ) {}

    getOrganisationId(): Hash {
        return this.organisationId;
    }

    getName() {
        return this.description.name;
    }

    getDescription() {
        return this.description.description;
    }

    getLogoUrl() {
        return this.description.logoUrl;
    }
}