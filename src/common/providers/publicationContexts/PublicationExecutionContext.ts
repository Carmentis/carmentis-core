import {CMTSToken} from "../../economics/currencies/token";

export class PublicationExecutionContext {
    private static defaultGasPrice: CMTSToken = CMTSToken.createCMTS(1);
    private gasPrice: CMTSToken;
    constructor() {
        this.gasPrice = PublicationExecutionContext.defaultGasPrice;
    }

    getGasPrice() {
        return this.gasPrice
    }

    withGasPrice(gasPrice: CMTSToken) {
        this.gasPrice = gasPrice;
        return this;
    }

}
