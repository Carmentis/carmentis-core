import { AbstractMicroBlock } from "../entities/MicroBlock";
import {BlockchainWriter} from "./provider";
import {NotImplementedError} from "../errors/carmentis-error";

export class ABCINodeBlockchainWriter implements BlockchainWriter {
    publishMicroBlock(microBlock: AbstractMicroBlock): Promise<void> {
        throw new NotImplementedError()
    }

}