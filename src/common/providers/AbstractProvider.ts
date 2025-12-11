import {IProvider} from "./IProvider";
import {PublicSignatureKey} from "../crypto/signature/PublicSignatureKey";
import {Hash} from "../entities/Hash";
import {ValidatorNodeVb} from "../blockchain/virtualBlockchains/ValidatorNodeVb";
import {AccountVb} from "../blockchain/virtualBlockchains/AccountVb";
import {ApplicationLedgerVb} from "../blockchain/virtualBlockchains/ApplicationLedgerVb";
import {MicroblockBody, MicroblockHeaderObject, VirtualBlockchainState} from "../type/types";
import {ApplicationVb} from "../blockchain/virtualBlockchains/ApplicationVb";
import {OrganizationVb} from "../blockchain/virtualBlockchains/OrganizationVb";
import {ProtocolVb} from "../blockchain/virtualBlockchains/ProtocolVb";
import {VirtualBlockchain} from "../blockchain/virtualBlockchains/VirtualBlockchain";
import {VirtualBlockchainNotFoundError} from "../errors/carmentis-error";
import {VirtualBlockchainStatus} from "../type/VirtualBlockchainStatus";
import {ProtocolInternalState} from "../blockchain/internalStates/ProtocolInternalState";
import {InternalStateFactory} from "../blockchain/internalStates/InternalStateFactory";
import {Logger} from "../utils/Logger";
import {Utils} from "../utils/utils";

export abstract class AbstractProvider implements IProvider {
    private log = Logger.getAbstractProviderLogger(AbstractProvider.name);

    async loadValidatorNodeVirtualBlockchain(validatorNodeId: Hash) {
        const vb = new ValidatorNodeVb(this);
        await this.initializeVirtualBlockchain(vb, validatorNodeId);
        return vb;
    }

    async loadAccountVirtualBlockchain(accountId: Hash) {
        this.log.debug(`Loading account virtual blockchain with id ${accountId.encode()}`)
        const vb = new AccountVb(this);
        await this.initializeVirtualBlockchain(vb, accountId);
        return vb;
    }

    async loadApplicationLedgerVirtualBlockchain(appLedgerId: Hash) {
        const vb = new ApplicationLedgerVb(this);
        await this.initializeVirtualBlockchain(vb, appLedgerId);
        return vb;
    }

    async loadApplicationVirtualBlockchain(applicationId: Hash) {
        const vb = new ApplicationVb(this);
        await this.initializeVirtualBlockchain(vb, applicationId);
        return vb;
    }

    async loadOrganizationVirtualBlockchain(organizationId: Hash) {
        const orgVb = new OrganizationVb(this);
        await this.initializeVirtualBlockchain(orgVb, organizationId);
        return orgVb;
    }

    async loadProtocolVirtualBlockchain(protocolId: Hash) {
        const vb = new ProtocolVb(this);
        await this.initializeVirtualBlockchain(vb, protocolId);
        return vb;
    }


    //abstract getMicroblockInformation(microblockHash: Uint8Array): Promise<MicroblockInformationSchema | null>;
    abstract getVirtualBlockchainStatus(virtualBlockchainId: Uint8Array): Promise<VirtualBlockchainStatus | null>
    abstract getAccountIdFromPublicKey(publicKey: PublicSignatureKey): Promise<Hash>;
    abstract getListOfMicroblockBody(microblockHashes: Uint8Array[]): Promise<MicroblockBody[]>
    abstract getMicroblockBody(microblockHash: Hash): Promise<MicroblockBody | null>;
    abstract getMicroblockHeader(microblockHash: Hash): Promise<MicroblockHeaderObject | null>;
    abstract getVirtualBlockchainIdContainingMicroblock(microblockHash: Hash): Promise<Hash>;
    abstract getVirtualBlockchainState(virtualBlockchainId: Uint8Array): Promise<VirtualBlockchainState | null>;
    abstract getProtocolVariables(): Promise<ProtocolInternalState>;


    private async initializeVirtualBlockchain(vb :VirtualBlockchain, vbId: Hash) {
        const identifier = vbId.toBytes()
        const vbState = await this.getVirtualBlockchainStatus(identifier);
        if (vbState === null || vbState.state === undefined) {
            throw new VirtualBlockchainNotFoundError(vbId);
        }
        // the type is already assigned when creating the virtual blockchain
        if (vbState.state.type !== vb.getType()) throw new Error("Invalid blockchain type loaded");

        vb.setIdentifier(identifier) //this.identifier = identifier;
        vb.setHeight(vbState.state.height) //this.height = content.state.height;
        vb.setExpirationDay(vbState.state.expirationDay) //this.expirationDay = content.state.expirationDay;
        vb.setMicroblockHashes(vbState.microblockHashes) // this.microblockHashes = content.microblockHashes;
        vb.setInternalState(
            InternalStateFactory.createInternalStateFromObject(
                vb.getType(),
                vbState.state.internalState
            )
        );
    }





}