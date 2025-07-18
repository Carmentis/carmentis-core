import {PublicationExecutionContext} from "./PublicationExecutionContext";
import {Hash} from "../../entities/Hash";
import {IllegalUsageError} from "../../errors/carmentis-error";
import {Optional} from "../../entities/Optional";

export class ApplicationPublicationExecutionContext extends PublicationExecutionContext {
    private applicationId: Optional<Hash> = Optional.none();
    private organisationId: Optional<Hash> = Optional.none();
    private applicationName: string = '';
    private applicationDescription: string = '';
    private logoUrl: string = "";
    private homepageUrl: string = "";

    withExistingApplicationId(applicationId: Hash): ApplicationPublicationExecutionContext {
        this.applicationId = Optional.some(applicationId);
        return this;
    }

    withOrganisationId(organisationId: Hash): ApplicationPublicationExecutionContext {
        this.organisationId = Optional.some(organisationId);
        return this;
    }

    withApplicationName(applicationName: string): ApplicationPublicationExecutionContext {
        this.applicationName = applicationName;
        return this;
    }

    withApplicationDescription(applicationDescription: string): ApplicationPublicationExecutionContext {
        this.applicationDescription = applicationDescription;
        return this;
    }

    build() {
        return {
            applicationId: this.applicationId,
            organisationId: this.organisationId,
            applicationName: this.applicationName,
            applicationDescription: this.applicationDescription,
            logoUrl: this.logoUrl,
            homepageUrl: this.homepageUrl
        };
    }
}