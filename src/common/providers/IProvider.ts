import {MicroblockInformationSchema} from "../type/types";
import {Hash} from "../entities/Hash";
import {ValidatorNodeVb} from "../blockchain/virtualBlockchains/ValidatorNodeVb";
import {AccountVb} from "../blockchain/virtualBlockchains/AccountVb";
import {ApplicationLedgerVb} from "../blockchain/virtualBlockchains/ApplicationLedgerVb";
import {ApplicationVb} from "../blockchain/virtualBlockchains/ApplicationVb";
import {OrganizationVb} from "../blockchain/virtualBlockchains/OrganizationVb";
import {ProtocolVb} from "../blockchain/virtualBlockchains/ProtocolVb";

export interface IProvider {
    getMicroblockInformation(microblockHash: Uint8Array): Promise<MicroblockInformationSchema|null> ;
    getMicroblockBodys(microblockHashes: Uint8Array[]):  Promise<{hash: Uint8Array<ArrayBufferLike>, body: Uint8Array<ArrayBufferLike>}[]>;
    loadProtocolVirtualBlockchain(protocolId: Hash): Promise<ProtocolVb>;
    loadValidatorNodeVirtualBlockchain(validatorNodeId: Hash): Promise<ValidatorNodeVb>;
    loadAccountVirtualBlockchain(accountId: Hash): Promise<AccountVb>;
    loadApplicationLedgerVirtualBlockchain(appLedgerId: Hash): Promise<ApplicationLedgerVb>;
    loadApplicationVirtualBlockchain(applicationId: Hash): Promise<ApplicationVb>;
    loadOrganizationVirtualBlockchain(organizationId: Hash): Promise<OrganizationVb>;
}