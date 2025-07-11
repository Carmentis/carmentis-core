import {MicroBlockType} from "../proto/section";
import {AbstractMicroBlock, AccountMicroBlock, ApplicationMicroBlock, OrganisationMicroBlock} from "./MicroBlock";
import {
    CarmentisError,
    MicroBlockNotFoundInVirtualBlockchainAtHeightError,
    IllegalUsageError, IllegalParameterError
} from "../errors/carmentis-error";
import {ConflictViewResolutionStrategy} from "./ConflictViewResolutionStrategy";
import {AlwaysReplaceConflictViewResolutionStrategy} from "./AlwaysReplaceConflictViewResolutionStrategy";
import {VirtualBlockchainType} from "./VirtualBlockchainType";
import {VirtualBlockchainState} from "./VirtualBlockchainState";
import {Hash} from "./Hash";

/**
 * Abstract class representing a virtual blockchain view.
 * This class provides functionality for interacting with and managing a virtual blockchain's state and microblocks.
 * It is designed to be extended for specific implementations.
 *
 * @template T Type parameter representing the microblock type that extends AbstractMicroBlock.
 */
export abstract class AbstractVirtualBlockchainView<T extends AbstractMicroBlock> {


    private resolutionStrategy: ConflictViewResolutionStrategy = new AlwaysReplaceConflictViewResolutionStrategy();
    private microBlocks: Map<number, T> = new Map();

    constructor(
        private state: VirtualBlockchainState
    ) {}


    /**
     * Retrieves the unique VB ID from the current state.
     *
     * @return {Hash} The VB ID extracted from the state.
     */
    getVbId(): Hash {
        return this.state.getVbId();
    };


    /**
     * Checks if the current state height is up-to-date with the latest known height from microBlocks.
     * Compares the state's height against the maximum key value in microBlocks.
     *
     * @return {boolean} Returns true if the state's height matches the latest known height, otherwise false.
     */
    isUpToDate(): boolean {
        const knownHeight = Math.max(...this.microBlocks.keys());
        return this.state.getHeight() == knownHeight;
    }

    /**
     * Retrieves the virtual blockchain height from the state.
     *
     * @return {number} The current height of the virtual blockchain.
     */
    getVirtualBlockchainHeight() {
        return this.state.getHeight();
    }


    /**
     * Retrieves the first micro block from the data set.
     *
     * @return {Object|null} The first micro block object if available, or null if no micro blocks exist.
     */
    getFirstMicroBlock() {
        return this.getMicroBlockAtHeigh(1);
    }

    /**
     * Retrieves the microblock at the specified height from the virtual blockchain.
     *
     */
    getMicroBlockAtHeigh(height: number): T {
        const microBlock = this.microBlocks.get(height);
        if (microBlock === undefined)  throw new MicroBlockNotFoundInVirtualBlockchainAtHeightError(
            this.state.getVbId(),
            height
        )  ;
        return microBlock;
    }


    /**
     * Checks if there is a microblock present at the specified blockchain height.
     *
     * @param {number} height - The blockchain height to check for a microblock.
     * @return {boolean} Returns true if a microblock exists at the given height, otherwise false.
     */
    containsMicroBlockAtHeight( height: number ): boolean {
        if (this.getVirtualBlockchainHeight() < height) return false;
        return this.microBlocks.has(height);
    }

    /**
     * Adds a micro block to the current view if it matches the supported micro block type for the view.
     *
     * @param {T} microBlock - The micro block to be added. Its type must match the supported micro block type of the view.
     * @return {void} No value is returned from this method.
     * @throws {IllegalUsageError} Throws an error if the type of the provided micro block does not match the supported type for the view.
     */
    addMicroBlock(microBlock: T) {
        const supportedMicroBlockType = this.getSupportedMicroBlockType();
        if (microBlock.getMicroBlockType() !== supportedMicroBlockType) throw new IllegalUsageError("Cannot accept micro block of type " + microBlock.getMicroBlockType() + " in a view of type " + this.getType() + "")
        this.microBlocks.set(microBlock.getMicroBlockHeight(), microBlock)
    }

    setConflictResolutionStrategy(strategy: ConflictViewResolutionStrategy) {
        this.resolutionStrategy = strategy;
    }

    /**
     * Retrieves the hash of the last microblock.
     *
     * @return {Hash} The hash of the last microblock.
     */
    getLastMicroBlockHash(): Hash {
        return this.state.getLastMicroblockHash()
    }


    /**
     * Updates the current virtual blockchain view with data from the provided view.
     * Ensures that the virtual blockchain IDs match and resolves potential conflicts
     * between microblocks based on the instance's resolution strategy.
     *
     * @param {AbstractVirtualBlockchainView<T>} view - The view containing updated blockchain data.
     * @return {void} This method does not return any value.
     * @throws {CarmentisError} If the provided view has a different virtual blockchain ID.
     */
    updateView(view: AbstractVirtualBlockchainView<T>) {
        // reject views
        if (this.state.getVbId().toBytes() !== view.getVbId().toBytes())
            throw new IllegalParameterError("Cannot update view with a different virtual blockchain ID")

        // update the state
        const otherIsUpToDate = this.state.getHeight() <= view.getVirtualBlockchainHeight();
        const newHeight = Math.max(this.state.getHeight(), view.getVirtualBlockchainHeight());
        const newLastHash = otherIsUpToDate ? view.getLastMicroBlockHash() : this.getLastMicroBlockHash();
        const state = this.state;
        this.state = new class extends VirtualBlockchainState {
            getLastMicroblockHash = () => newLastHash
            getType = () => state.getType();
            getHeight = () => newHeight;
            getVbId = () => state.getVbId()
        }

        // add micro-block
        for (const [height, microBlock] of view.microBlocks.entries()) {
            // update if this view does not contain the micro-block
            const viewHasBlockAtHeight = this.containsMicroBlockAtHeight(height);
            if (!viewHasBlockAtHeight) {
                this.microBlocks.set(height, microBlock);
            } else {
                // solve the conflict
                const shouldUpdate = this.resolutionStrategy.shouldReplaceMicroBlock(this.getMicroBlockAtHeigh(height), microBlock);
                if (shouldUpdate) {
                    this.microBlocks.set(height, microBlock);
                }
            }
        }
    }


    /**
     * Abstract method to retrieve the type of the virtual blockchain.
     *
     * @return {VirtualBlockchainType} The type of the virtual blockchain.
     */
    abstract getType(): VirtualBlockchainType;

    /**
     * Returns the type of microblock that is supported.
     *
     * @return {MicroBlockType} The supported microblock type.
     */
    abstract getSupportedMicroBlockType(): MicroBlockType;
}

/**
 * Represents a blockchain view specific to account-related operations.
 * This class extends the functionality of AbstractVirtualBlockchainView,
 * providing specialized implementations for handling and viewing account microblocks.
 *
 * @class
 * @extends AbstractVirtualBlockchainView<AccountMicroBlock>
 */
export class AccountVirtualBlockchainView extends AbstractVirtualBlockchainView<AccountMicroBlock> {
    getSupportedMicroBlockType(): MicroBlockType {
        return MicroBlockType.ACCOUNT_MICROBLOCK;
    }

    getType(): VirtualBlockchainType {
        return VirtualBlockchainType.ACCOUNT_VIRTUAL_BLOCKCHAIN;
    }
}

/**
 * OrganisationVirtualBlockchainView is a specialized virtual blockchain view for handling
 * organization-specific microblocks within the blockchain infrastructure.
 * This class extends the AbstractVirtualBlockchainView and provides implementations
 * specific to organisation-related blockchain views.
 *
 * It identifies the type of supported microblock and the type of virtual blockchain
 * it represents.
 *
 * Methods:
 * - `getSupportedMicroBlockType`: Returns the specific microblock type that this view supports.
 * - `getType`: Returns the type of virtual blockchain associated with this view.
 *
 * This class is intended to be used in scenarios where organization-centric blockchain
 * functionalities are required.
 */
export class OrganisationVirtualBlockchainView extends AbstractVirtualBlockchainView<OrganisationMicroBlock> {
    getSupportedMicroBlockType(): MicroBlockType {
        return MicroBlockType.ORGANISATION_MICROBLOCK;
    }

    getType(): VirtualBlockchainType {
        return VirtualBlockchainType.ORGANISATION_VIRTUAL_BLOCKCHAIN;
    }
}


/**
 * Represents a virtual blockchain view specifically for application-related use cases.
 * Extends the AbstractVirtualBlockchainView class, utilizing ApplicationMicroBlock as the microblock type.
 */
export class ApplicationVirtualBlockchainView extends AbstractVirtualBlockchainView<ApplicationMicroBlock> {
    getSupportedMicroBlockType(): MicroBlockType {
        return MicroBlockType.APPLICATION_MICROBLOCK;
    }

    getType(): VirtualBlockchainType {
        return VirtualBlockchainType.APPLICATION_VIRTUAL_BLOCKCHAIN;
    }

}



