import {PublicationExecutionContext} from "./PublicationExecutionContext";
import {OrganizationDescription} from "../../blockchain/types";
import {IllegalParameterError} from "../../errors/carmentis-error";
import {Hash} from "../../entities/Hash";
import {Optional} from "../../entities/Optional";

/**
 * Represents the execution context specific to an organisation's publication process.
 * This class extends the base functionality provided by the `PublicationExecutionContext`
 * to introduce organisation-related context and processing behaviors.
 *
 * The `OrganisationPublicationExecutionContext` class is designed to handle execution logic
 * relating to publications scoped to an organisation. It may include additional information,
 * configurations, or methods tailored for handling publication requirements and behaviors
 * within an organisational structure or context.
 *
 * This class may interact with organisational data, apply rules, or influence the
 * execution environment in a way that aligns with organisational publication processes.
 *
 * Extends:
 * - `PublicationExecutionContext`: This class extends the base functionality provided by the
 *   `PublicationExecutionContext`. It inherits all the core functionalities while allowing
 *   additional organisation-specific modifications or extensions.
 */
export class OrganisationPublicationExecutionContext extends PublicationExecutionContext {
    private organisationId: Optional<Hash> = Optional.none();
    private name: string = '';
    private city: string = '';
    private countryCode: string = '';
    private website: string = '';

    /**
     * Specifies that publication is being performed on an existing organisation.
     *
     * If the organisation is not found, publication will fail.
     *
     * @param organisationId
     */
    withExistingOrganisationId(organisationId: Hash): OrganisationPublicationExecutionContext {
        this.organisationId = Optional.some(organisationId);
        return this;
    }

    withName(name: string): OrganisationPublicationExecutionContext {
        this.name = name;
        return this;
    }

    withCity(city: string): OrganisationPublicationExecutionContext {
        this.city = city;
        return this;
    }

    withCountryCode(countryCode: string): OrganisationPublicationExecutionContext {
        if (countryCode.length !== 2) throw new IllegalParameterError("Country code must be a two-letter code.")
        this.countryCode = countryCode;
        return this;
    }

    withWebsite(website: string): OrganisationPublicationExecutionContext {
        this.website = website;
        return this;
    }


    build() {
        return {
            existingOrganisationId: this.organisationId,
            name: this.name,
            city: this.city,
            countryCode: this.countryCode,
            website: this.website
        };
    }

}