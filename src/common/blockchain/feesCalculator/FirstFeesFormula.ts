import {IFeesFormula} from "./IFeesFormula";
import {Microblock} from "../microblock/Microblock";
import {CMTSToken} from "../../economics/currencies/token";
import {Section} from "../../type/Section";
import {ECO} from "../../constants/constants";
import {SectionType} from "../../type/SectionType";
import {SignatureSchemeId} from "../../crypto/signature/SignatureSchemeId";

/**
 * FirstFeesFormula is a concrete implementation of the IFeesFormula interface.
 * It provides a mechanism to compute the fees for a transaction based on
 * the size of a given microblock and a fixed gas fee formula.
 */
export class FirstFeesFormula implements IFeesFormula {
    private static DEFAULT_GAS_PRICE = CMTSToken.createAtomic(1);

    async computeFees(signatureSchemeId: SignatureSchemeId, microblock: Microblock): Promise<CMTSToken> {
        const totalSize = this.computeSizeInBytesOfMicroblock(microblock);
        const definedGasPrice = microblock.getGasPrice();
        const usedGasPrice = definedGasPrice.isZero() ? FirstFeesFormula.DEFAULT_GAS_PRICE : definedGasPrice;
        const additionalCosts =  this.getAdditionalCosts(signatureSchemeId)
        return CMTSToken.createAtomic(
            (
                ECO.FIXED_GAS_FEE +
                ECO.GAS_PER_BYTE * totalSize +
                additionalCosts
            ) * usedGasPrice.getAmountAsAtomic()
        );
    }

    private getAdditionalCosts(signatureSchemeId: SignatureSchemeId) {
        // TODO: add additional costs based on signature scheme
        return 0;
    }

    /**
     * Computes the total size in bytes of the provided microblock, excluding the last section
     * if it is a SIGNATURE type section.
     *
     * @param {Microblock} microblock - The microblock object whose size needs to be computed.
     * @return {number} The total size in bytes of the microblock, excluding any SIGNATURE type section at the end.
     */
    private computeSizeInBytesOfMicroblock(microblock: Microblock): number {
        const sections = microblock.getAllSections();
        if (sections.length === 0) return 0;

        // if the last section is a signature, we exclude it from the computation of the total size
        const isLastSectionSig = sections[sections.length - 1].type === SectionType.SIGNATURE;
        let sectionsUsedInComputeOfSize = isLastSectionSig ?
            sections.slice(0, sections.length - 1) :
            sections;
        const totalSize = sectionsUsedInComputeOfSize.reduce((total: number, section: Section) =>
                total + section.data.length,
            0
        );
        return totalSize
    }
}