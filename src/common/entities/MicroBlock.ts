import {MicroBlockSchema, MicroBlockType, SectionSchema, SectionType} from "../proto/section";
import {Section} from "./Section";
import {CMTSToken} from "../economics/currencies/token";
import {Hash} from "../blockchain/types";

/**
 * This class models constraints on the sections contained in a microblock.
 */
class MicroBlockValidityConstraint {
    private static INF = -1;
    private constraints : Map<SectionType, {min: number, max: number}> = new Map();

    addExactlyOneSectionConstraint(sectionType: SectionType) {
        this.constraints.set(sectionType, {min: 1, max: 1});
    }

    addAtLeastOneSectionConstraint(sectionType: SectionType) {
        this.constraints.set(sectionType, {min: 1, max: MicroBlockValidityConstraint.INF});
    }

    addExactSectionConstraint(sectionType: SectionType, count: number) {
        this.constraints.set(sectionType, {min: count, max: count});
    }

    addAtMostSectionConstraint(sectionType: SectionType, count: number) {
        this.constraints.set(sectionType, {min: 0, max: count});
    }

    checkIfConstraintAreSatisfied(sections: Section[]): boolean {
        // we first create a map counting the number of section types (O(N))
        const countBySectionTypes = new Map();
        for(const section of sections) {
            const sectionType = section.getSectionType();
            countBySectionTypes.set(
                sectionType,
                countBySectionTypes.has(sectionType) ? countBySectionTypes.get(sectionType) + 1 : 1,
            );

            // we can abort earlier if a section is not allowed on the set of constraints
            if (!this.constraints.has(sectionType)) {
                return false;
            }
        }

        // then we check if the number of sections for each type is within the constraints (O(N))
        for (const sectionType of countBySectionTypes.keys()) {
            const count = countBySectionTypes.get(sectionType);
            const constraint = this.constraints.get(sectionType);
            if(constraint) {
                if (count < constraint.min) return false
                if(count < constraint.min || count > constraint.max) {
                    return false;
                }
            }
        }

        return true;
    }
}


export interface MicroBlockHeader {
    magicString: string;
    protocolVersion: number;
    height: number;
    previousHash: Uint8Array;
    timestamp: number;
    gas: CMTSToken;
    gasPrice: CMTSToken;
    bodyHash: Uint8Array;
}

export abstract class MicroBlock {

    constructor(
        private header: MicroBlockHeader,
        private hash: Uint8Array,
        private sections: Section[],
        private feesPayerAccount?: Uint8Array | undefined,
    ) {}



    getGasPrice(): CMTSToken {
        return this.header.gasPrice;
    }

    getMicroBlockHash(): Hash {
        //const sectionsData =
        return Hash.from(this.hash);
    }


    setFeesPayerAccount(account: Hash) {
        this.feesPayerAccount = account.toBytes();
    }



    searchSectionsByType(sectionType: SectionType): Section[] {
        return this.sections.filter(section => section.isSectionType(sectionType));
    }

    isValid(): boolean {
        const constraint = this.getMicroblockConstraints();
        return constraint.checkIfConstraintAreSatisfied(this.sections);
    }

    abstract getMicroblockConstraints(): MicroBlockValidityConstraint;
}

export class AccountMicroBlock extends MicroBlock {
    getMicroblockConstraints(): MicroBlockValidityConstraint {
        const constraints = new MicroBlockValidityConstraint();
        constraints.addAtMostSectionConstraint(SectionType.ACCOUNT_PUBLIC_KEY, 1);
        constraints.addAtMostSectionConstraint(SectionType.ACCOUNT_CREATION, 1);
        return constraints
    }
}