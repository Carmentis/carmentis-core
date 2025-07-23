import {ApplicationLedger} from "../blockchain/ApplicationLedger";
import {Height} from "../entities/Height";
import {ProofBuilder} from "../entities/ProofBuilder";
import {Hash} from "../entities/Hash";

export class ApplicationLedgerWrapper {
    static async wrap(appLedger: ApplicationLedger) {
        return new ApplicationLedgerWrapper(appLedger);
    }

    private constructor(
        private readonly appLedger: ApplicationLedger
    ) {}

    async getRecordAtHeight<T = any>(height: Height): Promise<T> {
        return await this.appLedger.getRecord(height) as T;
    }

    async getRecordAtFirstBlock<T = any>(): Promise<T> {
        return this.getRecordAtHeight(1);
    }

    getId() {
        return this.appLedger.getVirtualBlockchainId();
    }

    isActorSubscribed(actorName: string): boolean {
        return this.appLedger.actorIsSubscribed(actorName);
    }

    getApplicationId(): Hash {
        return this.appLedger.getApplicationId()
    }


    async getGenesisSeed() {
        return this.appLedger.getGenesisSeed();
    }

    async getHeight() {
        return this.appLedger.getHeight();
    }

    async createProofBuilderForApplicationLedger() {
        const applicationLedgerId = await this.getId();
        return ProofBuilder.createProofBuilder(applicationLedgerId, this.appLedger);
    }
    

}