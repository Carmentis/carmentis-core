import {SectionType} from "../proto/section";
import {Section} from "./Section";

interface UnitConstraint {
    min: number,
    max: number,
    sectionType: SectionType,
}

interface GroupConstraints {
    sumOfGroupConstraint?: {
        min: number,
        max: number,
    }
    constraints: UnitConstraint[]
}

/**
 * This class models constraints on the sections contained in a microblock.
 */
export class MicroBlockSectionConstraint {
    private static readonly UNLIMITED = -1;
    private static readonly ANY_HEIGHT = -2;
    private static readonly EXACTLY_ONE = {min: 1, max: 1};
    private static readonly AT_LEAST_ONE = {min: 1, max: MicroBlockSectionConstraint.UNLIMITED};
    private static readonly ZERO_TO_UNLIMITED = {min: 0, max: MicroBlockSectionConstraint.UNLIMITED};
    private static readonly ZERO_TO_ONE = {min: 0, max: 1};

    private constraintsByHeight: Map<number, GroupConstraints[]> = new Map();

    addExactlyOneSectionConstraint(sectionType: SectionType, height: number = MicroBlockSectionConstraint.ANY_HEIGHT) {
        this.addConstraintAtHeight(height, {
            constraints: [{sectionType, ...MicroBlockSectionConstraint.EXACTLY_ONE}]
        });
    }

    addAtMostSectionConstraint(sectionType: SectionType, count: number, height: number = MicroBlockSectionConstraint.ANY_HEIGHT) {
        this.addConstraintAtHeight(height, {
            constraints: [{sectionType, ...MicroBlockSectionConstraint.ZERO_TO_UNLIMITED}]
        });
    }

    addAtLeastOneAmongConstraint(sectionTypes: SectionType[], height: number = MicroBlockSectionConstraint.ANY_HEIGHT) {
        this.addConstraintAtHeight(height, {
            sumOfGroupConstraint: MicroBlockSectionConstraint.AT_LEAST_ONE,
            constraints: sectionTypes.map(sectionType => ({
                sectionType,
                ...MicroBlockSectionConstraint.ZERO_TO_UNLIMITED
            }))
        });
    }

    addExactlyOneAmongConstraint(sectionTypes: SectionType[], height: number = MicroBlockSectionConstraint.ANY_HEIGHT) {
        this.addConstraintAtHeight(height, {
            sumOfGroupConstraint: MicroBlockSectionConstraint.EXACTLY_ONE,
            constraints: sectionTypes.map(sectionType => ({
                sectionType,
                ...MicroBlockSectionConstraint.ZERO_TO_ONE
            }))
        });
    }

    checkIfConstraintAreSatisfied(sections: Section[], height: number = MicroBlockSectionConstraint.ANY_HEIGHT): boolean {
        const sectionTypeCounts = this.createSectionTypeCountMap(sections);
        const heightsToValidate = this.getHeightsToValidate(height);

        return this.validateConstraintsForHeights(heightsToValidate, sectionTypeCounts);
    }

    private createSectionTypeCountMap(sections: Section[]): Map<SectionType, number> {
        const countBySectionTypes = new Map<SectionType, number>();

        for (const section of sections) {
            const sectionType = section.getSectionType();
            countBySectionTypes.set(sectionType, (countBySectionTypes.get(sectionType) || 0) + 1);
        }

        return countBySectionTypes;
    }

    private getHeightsToValidate(height: number): number[] {
        const heightsToCheck = [MicroBlockSectionConstraint.ANY_HEIGHT];
        if (height !== MicroBlockSectionConstraint.ANY_HEIGHT) {
            heightsToCheck.push(height);
        }
        return heightsToCheck;
    }

    private validateConstraintsForHeights(heights: number[], sectionTypeCounts: Map<SectionType, number>): boolean {
        for (const height of heights) {
            const constraints = this.constraintsByHeight.get(height);
            if (!constraints) continue;

            if (!this.validateGroupConstraints(constraints, sectionTypeCounts)) {
                return false;
            }
        }
        return true;
    }

    private validateGroupConstraints(groupConstraints: GroupConstraints[], sectionTypeCounts: Map<SectionType, number>): boolean {
        for (const groupConstraint of groupConstraints) {
            if (!this.validateSingleGroupConstraint(groupConstraint, sectionTypeCounts)) {
                return false;
            }
        }
        return true;
    }

    private validateSingleGroupConstraint(groupConstraint: GroupConstraints, sectionTypeCounts: Map<SectionType, number>): boolean {
        let groupCount = 0;

        for (const constraint of groupConstraint.constraints) {
            const count = sectionTypeCounts.get(constraint.sectionType) || 0;

            if (!this.isCountWithinBounds(count, constraint.min, constraint.max)) {
                return false;
            }

            groupCount += count;
        }

        if (groupConstraint.sumOfGroupConstraint) {
            const {min, max} = groupConstraint.sumOfGroupConstraint;
            return this.isCountWithinBounds(groupCount, min, max);
        }

        return true;
    }

    private isCountWithinBounds(count: number, min: number, max: number): boolean {
        return count >= min && (max === MicroBlockSectionConstraint.UNLIMITED || count <= max);
    }

    private addConstraintAtHeight(height: number, constraint: GroupConstraints): void {
        const existingConstraints = this.constraintsByHeight.get(height);
        if (existingConstraints) {
            existingConstraints.push(constraint);
        } else {
            this.constraintsByHeight.set(height, [constraint]);
        }
    }
}