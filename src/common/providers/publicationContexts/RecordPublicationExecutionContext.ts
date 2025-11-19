import {PublicationExecutionContext} from "./PublicationExecutionContext";
import {StateUpdateRequest} from "../../blockchain/StateUpdateRequest";
import {IllegalUsageError} from "../../errors/carmentis-error";
import {ExpirationDate} from "../ExpirationDate";

export class RecordPublicationExecutionContext<T> extends PublicationExecutionContext {

    private expirationDate: ExpirationDate;
    private record?: StateUpdateRequest<T>;

    constructor() {
        super();
        this.expirationDate = ExpirationDate.endless();
    }

    withRecord(record: StateUpdateRequest<T>): RecordPublicationExecutionContext<T> {
        this.record = record;
        return this;
    }

    /**
     * Set the expiration date of the virtual blockchain.
     *
     * Note: An expiration date can only be specified during the creation of the virtual blockchain.
     *
     * @param expirationDate
     */
    widthExpirationDate(expirationDate: ExpirationDate): RecordPublicationExecutionContext<T> {
        this.expirationDate = expirationDate;
        return this;
    }

    getExpirationDate() {
        return this.expirationDate;
    }

    build(): StateUpdateRequest<T> {
        if (!this.record) throw new IllegalUsageError("Record is required for record publication.")
        return this.record;
    }
}