import {PublicationExecutionContext} from "./PublicationExecutionContext";
import {Hash} from "../../entities/Hash";
import {IllegalUsageError} from "../../errors/carmentis-error";

export class ApplicationPublicationExecutionContext extends PublicationExecutionContext {
    private organisationId?: Hash;
    private applicationName: string = '';
    private applicationDescription: string = '';
    private logoUrl: string = "";
    private homepageUrl: string = "";

    withOrganisationId(organisationId: Hash): ApplicationPublicationExecutionContext {
        this.organisationId = organisationId;
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
        if (!this.organisationId) throw new IllegalUsageError("Organisation ID is required for application publication.");
        return {
            organisationId: this.organisationId,
            applicationName: this.applicationName,
            applicationDescription: this.applicationDescription,
            logoUrl: this.logoUrl,
            homepageUrl: this.homepageUrl
        };
    }
}