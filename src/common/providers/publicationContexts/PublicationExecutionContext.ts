import {CMTSToken} from "../../economics/currencies/token";
import {Utils} from "../../utils/utils";

export class PublicationExecutionContext {
    private static defaultGasPrice: CMTSToken = CMTSToken.createDeciToken(1);
    private static defaultExpirationDay: 0;
    private gasPrice: CMTSToken;
    private expirationDay: number;

    constructor() {
        this.gasPrice = PublicationExecutionContext.defaultGasPrice;
        this.expirationDay = PublicationExecutionContext.defaultExpirationDay;
    }

    getGasPrice() {
        return this.gasPrice;
    }

    getExpirationDay() {
        return this.expirationDay;
    }

    withGasPrice(gasPrice: CMTSToken) {
        this.gasPrice = gasPrice;
        return this;
    }

    withExpirationOn(year: number, month: number, day: number) {
        this.expirationDay = Utils.encodeDay(year, month, day);
        return this;
    }

    withExpirationIn(days: number) {
        const now = new Date();
        const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        const expirationDate = new Date(today.getTime() + days * 86400 * 1000);

        return this.withExpirationOn(
            expirationDate.getUTCFullYear(),
            expirationDate.getUTCMonth() + 1,
            expirationDate.getUTCDate()
        );
    }
}
