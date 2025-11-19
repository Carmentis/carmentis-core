import {Application} from "../blockchain/Application";
import {Hash} from "../entities/Hash";

import {ApplicationDescriptionSection} from "../blockchain/sectionSchemas";

export class ApplicationWrapper {
    static async wrap(application: Application) {
        const declaration = await application.getDeclaration();
        const organizationId = Hash.from(declaration.organizationId);
        const description =  await application.getDescription();
        return new ApplicationWrapper(organizationId, description);
    }

    private constructor(
        private readonly organizationId: Hash,
        private readonly description: ApplicationDescriptionSection
    ) {}

    /**
     * Retrieves the id of the organization managing the application.
     *
     * @return {Hash} The organization ID managing the application.
     */
    getOrganizationId(): Hash {
        return this.organizationId;
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