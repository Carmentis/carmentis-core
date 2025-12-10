
import {FirstFeesFormula} from "./FirstFeesFormula";
import {IFeesFormula} from "./IFeesFormula";

/**
 * The FeesCalculator class is responsible for calculating fees associated with a given microblock.
 */
export class FeesCalculationFormulaFactory {

    /**
     * This method returns the fees calculation formula used for the first microblock of the blockchain.
     */
    static getGenesisFeesCalculationFormula(): IFeesFormula {
        return new FirstFeesFormula();
    }

    static getFeesCalculationFormulaByVersion(version: number): IFeesFormula {
        return this.getGenesisFeesCalculationFormula();
    }

}
