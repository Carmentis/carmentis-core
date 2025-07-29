import {PublicationExecutionContext} from "./PublicationExecutionContext";
import {OrganizationDescription} from "../../blockchain/types";
import {IllegalParameterError} from "../../errors/carmentis-error";
import {Hash} from "../../entities/Hash";
import {Optional} from "../../entities/Optional";

/**
 * Represents the execution context specific to an organization's publication process.
 * This class extends the base functionality provided by the `PublicationExecutionContext`
 * to introduce organization-related context and processing behaviors.
 *
 * The `OrganizationPublicationExecutionContext` class is designed to handle execution logic
 * relating to publications scoped to an organization. It may include additional information,
 * configurations, or methods tailored for handling publication requirements and behaviors
 * within an organizational structure or context.
 *
 * This class may interact with organizational data, apply rules, or influence the
 * execution environment in a way that aligns with organizational publication processes.
 *
 * Extends:
 * - `PublicationExecutionContext`: This class extends the base functionality provided by the
 *   `PublicationExecutionContext`. It inherits all the core functionalities while allowing
 *   additional organization-specific modifications or extensions.
 */
export class OrganizationPublicationExecutionContext extends PublicationExecutionContext {
    private organizationId: Optional<Hash> = Optional.none();
    private name: string = '';
    private city: string = '';
    private countryCode: string = '';
    private website: string = '';

    /**
     * Specifies that publication is being performed on an existing organization.
     *
     * If the organization is not found, publication will fail.
     *
     * @param organizationId
     */
    withExistingOrganizationId(organizationId: Hash): OrganizationPublicationExecutionContext {
        this.organizationId = Optional.some(organizationId);
        return this;
    }

    withName(name: string): OrganizationPublicationExecutionContext {
        this.name = name;
        return this;
    }

    withCity(city: string): OrganizationPublicationExecutionContext {
        this.city = city;
        return this;
    }

    withCountryCode(countryCode: string): OrganizationPublicationExecutionContext {
        if (countryCode.length !== 2) throw new IllegalParameterError("Country code must be a two-letter code.")
        this.countryCode = countryCode;
        return this;
    }

    withWebsite(website: string): OrganizationPublicationExecutionContext {
        this.website = website;
        return this;
    }


    build() {
        return {
            existingOrganizationId: this.organizationId,
            name: this.name,
            city: this.city,
            countryCode: this.countryCode,
            website: this.website
        };
    }

}