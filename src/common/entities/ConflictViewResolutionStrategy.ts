import {AbstractMicroBlock} from "./MicroBlock";

export interface ConflictViewResolutionStrategy {

    /**
     * Determines whether the existing micro block should be replaced by another micro block.
     *
     * @param {AbstractMicroBlock} existingMicroBlock - The currently existing micro block.
     * @param {AbstractMicroBlock} otherMicroBlock - The micro block that is being considered for replacement.
     * @return {boolean} Returns true if the existing micro block should be replaced, otherwise false.
     */
    shouldReplaceMicroBlock(existingMicroBlock: AbstractMicroBlock, otherMicroBlock: AbstractMicroBlock): boolean;
}