import {Microblock} from "../../blockchain/Microblock";

export interface IMicroblockStructureChecker {
    checkMicroblockStructure(microblock: Microblock): boolean;
}