import {ConflictViewResolutionStrategy} from "./ConflictViewResolutionStrategy";
import {AbstractMicroBlock} from "./MicroBlock";

export class AlwaysReplaceConflictViewResolutionStrategy implements ConflictViewResolutionStrategy {
    shouldReplaceMicroBlock(existingMicroBlock: AbstractMicroBlock, otherMicroBlock: AbstractMicroBlock): boolean {
        return true;
    }
}