import {IFeesFormula} from "./IFeesFormula";
import {Microblock} from "../microblock/Microblock";
import {CMTSToken} from "../../economics/currencies/token";
import {ECO} from "../../constants/constants";
import {SectionType} from "../../type/valibot/blockchain/section/SectionType";
import {SignatureSchemeId} from "../../crypto/signature/SignatureSchemeId";
import {Section} from "../../type/valibot/blockchain/section/sections";
import {BlockchainUtils} from "../../utils/BlockchainUtils";
import {IProvider} from "../../providers/IProvider";
import {StoragePriceManager} from "./storagePriceManager";

/**
 * FirstFeesFormula is a concrete implementation of the IFeesFormula interface.
 * It provides a mechanism to compute the fees for a transaction based on
 * the size of a given microblock and a fixed gas fee formula.
 */
export class FirstFeesFormula implements IFeesFormula {
    private static DEFAULT_GAS_PRICE = CMTSToken.createAtomic(1);

    constructor(private provider: IProvider) {
    }

    async computeFees(vbId: Uint8Array, signatureSchemeId: SignatureSchemeId, microblock: Microblock): Promise<CMTSToken> {
        // we search the expiration day from the microblock
        const expirationDay = await this.searchExpirationDayFromMicroblock(this.provider, vbId, microblock);
        if (expirationDay < 0) throw new Error("Invalid expiration day");

        // we compute the storage price
        const protocolState = await this.provider.getProtocolState();
        const storagePriceManager  =  new StoragePriceManager(protocolState.getPriceStructure());
        const baseFee = CMTSToken.createCMTS(1);
        const storagePrice = storagePriceManager.getStoragePrice(baseFee, expirationDay);


        // we compute the microblock fees
        const totalSize = this.computeSizeInBytesOfMicroblock(microblock);
        const definedGasPrice = microblock.getGasPrice();
        const usedGasPrice = definedGasPrice.isZero() ? FirstFeesFormula.DEFAULT_GAS_PRICE : definedGasPrice;

        // we have an additional signature-related costs
        const additionalCosts =  this.getAdditionalCosts(signatureSchemeId)

        // we compute the fees
        const feesInAtomic =  (
            ECO.FIXED_GAS_FEE +
            ECO.GAS_PER_BYTE * totalSize +
            additionalCosts +
            storagePrice.getAmountAsAtomic()
        ) * usedGasPrice.getAmountAsAtomic();
        return CMTSToken.createAtomic(feesInAtomic);
    }

    private async searchExpirationDayFromMicroblock(provider: IProvider, vbId: Uint8Array, microblock: Microblock): Promise<number> {
        if (microblock.isGenesisMicroblock()) {
            return Microblock.extractExpirationDayFromGenesisPreviousHash(microblock.getPreviousHash().toBytes());
        } else {
            const vbState = await provider.getVirtualBlockchainState(vbId);
            if (vbState === null) throw new Error("Virtual blockchain state not found");
            return vbState.expirationDay;
        }
    }

    private getAdditionalCosts(signatureSchemeId: SignatureSchemeId) {
        switch (signatureSchemeId) {
            case SignatureSchemeId.SECP256K1: {
                return 1000;
            }
            case SignatureSchemeId.ML_DSA_65: {
                return 5000;
            }
            case SignatureSchemeId.PKMS_SECP256K1: {
                return 0;
            }
        }
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

        // if the gas fees are set (non-zero) in the microblock then, with high probabilities, the microblock
        // will not be modified later one and so we exclude the last signature section.
        // otherwise, the microblock will be modified later one and so we include the last signature section.
        const gasFeesContainedInMicroblock = microblock.getGas();
        if (gasFeesContainedInMicroblock.isZero()) {
            let totalSize = this.getSizeOfListOfSections(sections);
            return totalSize
        } else {
            // if the last section is a signature, we exclude it from the computation of the total size
            const isLastSectionSig = sections[sections.length - 1].type === SectionType.SIGNATURE;
            let sectionsUsedInComputeOfSize = isLastSectionSig ?
                sections.slice(0, sections.length - 1) :
                sections;
            const totalSize = this.getSizeOfListOfSections(sectionsUsedInComputeOfSize)
            return totalSize
        }


    }

    private getSizeOfListOfSections(sections: Section[]): number {
        return sections.reduce(
            (total: number, section: Section) => {
                const serializedSection = BlockchainUtils.encodeSection(section)
                return total + serializedSection.length
            },
            0
        );
    }
}