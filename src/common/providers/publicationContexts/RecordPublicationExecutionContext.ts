import {PublicationExecutionContext} from "./PublicationExecutionContext";
import {RecordDescription} from "../../blockchain/RecordDescription";
import {IllegalUsageError} from "../../errors/carmentis-error";

export class RecordPublicationExecutionContext<T> extends PublicationExecutionContext {
    private record?: RecordDescription<T>;

    constructor() {
        super();
    }

    withRecord(record: RecordDescription<T>): RecordPublicationExecutionContext<T> {
        this.record = record;
        return this;
    }

    build(): RecordDescription<T> {
        if (!this.record) throw new IllegalUsageError("Record is required for record publication.")
        return this.record;
    }
}