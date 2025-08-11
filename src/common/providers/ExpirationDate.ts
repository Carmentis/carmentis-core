import {Optional} from "../entities/Optional";

export class ExpirationDate {
    private expirationDate: Optional<Date>;
    private endless: boolean;

    private constructor(expirationDate: Optional<Date>, isEndless: boolean) {
        this.expirationDate = expirationDate;
        this.endless = isEndless;
    }


    static endless() {
        return new ExpirationDate(Optional.none(), true);
    }

    static of(expirationDate: Date) {
        return new ExpirationDate(Optional.of(expirationDate), false);
    }


    isEndless() {
        return this.endless;
    }

    getExpirationDate() {
        return this.expirationDate.unwrap();
    }
}