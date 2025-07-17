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

    /**
     * Retrieves the id of the organisation managing the application.
     *
     * @return {Hash} The organisation ID managing the application.
     */
    getOrganisationId(): Hash {
        return this.organisationId;
    }


    /**
     * Retrieves the homepage URL of the application.
     *
     * @return {string} The URL of the application's website.
     */
    getWebsite(): string {
        return this.description.homepageUrl;
    }

    /**
     * Retrieves the name of the application.
     * @return {string} Name of the application.
     */
    getName() {
        return this.description.name;
    }

    /**
     * Retrieves the description of the application.
     *
     * @return {string} The description of the application.
     */
    getDescription() {
        return this.description.description;
    }

    /**
     * Retrieves the logo URL from the description property.
     *
     * @return {string} The URL of the logo.
     */
    getLogoUrl() {
        return this.description.logoUrl;
    }
}