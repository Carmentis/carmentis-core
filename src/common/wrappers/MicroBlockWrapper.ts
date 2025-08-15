import {Microblock} from "../blockchain/Microblock";
import {Hash} from "../entities/Hash";
import {Optional} from "../entities/Optional";
import {CMTSToken} from "../economics/currencies/token";
import {MicroBlockInformation} from "../entities/MicroBlockInformation";

export class MicroBlockWrapper {
    
    static createFromMicroBlock(info: MicroBlockInformation, mb: Microblock) {
        return new MicroBlockWrapper(info, mb);
    }
    
    private constructor(
        private readonly info: MicroBlockInformation,
        private readonly mb: Microblock,
    ) {}

    public getAllSections()
    {
        return this.mb.getAllSections();
    }

    public getFeesPayerAccount()
    {
        const payerAccount = this.mb.getFeesPayerAccount();
        return payerAccount == null ? Optional.none<Hash>() : Optional.of(Hash.from(payerAccount));
    }

    public getPreviousHash()
    {
        return this.mb.getPreviousHash();
    }

    public getNumberOfSections()
    {
        return this.mb.getNumberOfSections();
    }

    public getGas() {
        return CMTSToken.createAtomic(this.mb.getGas());
    }

    public getGasPrice()
    {
        return CMTSToken.createAtomic(this.mb.getGasPrice());
    }

    public getTimestamp() {
        return new Date(this.mb.getTimestamp() * 1000);
    }

    public getMicroBlockHash() {
        return Hash.from(this.mb.hash);
    }

    public getVirtualBlockchainId() {
        return this.info.getVirtualBlockchainState().getVbId();
    }



    public getHeight()
    {
        return this.mb.getHeight();
    }
    
}