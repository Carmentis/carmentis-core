import {Provider} from "../providers/provider";
import {Explorer} from "./explorer";
import {MicroblockImporter} from "./microblockImporter";
import {Account} from "./account";
import {Organization} from "./organization";
import {ValidatorNode} from "./validatorNode";
import {Application} from "./application";
import {ApplicationLedger} from "./applicationLedger";
import {Utils} from "../utils/utils";
import {EncoderFactory} from "../utils/encoder";
import {PublicSignatureKey} from "../crypto/signature/signature-interface";
import {Hash} from "./types";

export interface RecordActor {
  name: string;
}

export interface RecordChannel {
  name: string;
  public: boolean;
}

export interface RecordChannelAssignation {
  fieldPath: string;
  channelName: string;
}

export interface RecordActorAssignation {
  actorName: string;
  channelName: string;
}

export interface RecordMaskedPart {
  position: number;
  length: number;
  replacementString: string;
}

export interface RecordMaskableField {
  fieldPath: string;
  maskedParts: RecordMaskedPart[];
}

export interface RecordHashableField {
  fieldPath: string;
}

export interface RecordDescription<DataType = any> {
  /**
   * Links the record to an application.
   */
  applicationId: string;

  /**
   * Links the record to an existing transactional flow. When omitted, the record is put in a new virtual blockchain.
   */
  virtualBlockchainId?: string;
  data: DataType;
  actors?: RecordActor[];
  channels?: RecordChannel[];
  channelAssignations?: RecordChannelAssignation[];
  actorAssignations?: RecordActorAssignation[];
  hashableFields?: RecordHashableField[];
  maskableFields?: RecordMaskableField[];
  author: string;
  endorser?: string;
}


export type OperatorAnchorRequest = Omit<RecordDescription, 'applicationId'> & { approvalMessage: string }


export class Blockchain {
  provider: any;
  constructor(provider: any) {
    this.provider = provider;
  }

  static createFromProvider(provider: Provider): Blockchain {
    return new Blockchain(provider);
  }

  getExplorer() {
    return new Explorer({ provider: this.provider });
  }

  getMicroblockImporter(data: any) {
    return new MicroblockImporter({ data, provider: this.provider });
  }

  /**
   * Should be used with a keyed provider.
   *
   * @returns {Promise<Account>}
   */
  async createGenesisAccount() {
    if (!this.provider.isKeyed()) throw 'Cannot create a genesis account without a keyed provider.'
    const account = new Account({ provider: this.provider });
    await account._createGenesis();
    return account;
  }

  /**
   * Should be used with a keyed provider.
   *
   * @param {Hash} sellerAccount
   * @param {PublicSignatureKey} buyerPublicKey
   * @param {number} amount
   * @returns {Promise<Account>}
   */
  async createAccount(sellerAccount: Hash, buyerPublicKey: PublicSignatureKey, amount: number) {
    if (!this.provider.isKeyed()) throw 'Cannot create an account without a keyed provider.'
    const hexEncoder = EncoderFactory.bytesToHexEncoder();
    const account = new Account({ provider: this.provider });
    await account._create(sellerAccount.toBytes(), buyerPublicKey, amount);
    return account;
  }


  /**
   * Loads an account using the given identifier.
   *
   * @param {Hash} identifier - The identifier for the account.
   * @return {Promise<Account>} A promise that resolves to an instance of the loaded account.
   */
  async loadAccount(identifier: Hash) {
    const hexEncoder = EncoderFactory.bytesToHexEncoder();
    const account = new Account({ provider: this.provider });
    await account._load(identifier.toBytes());
    return account;
  }

  /**
   * Should be used with a keyed provider.
   *
   * @returns {Promise<Organization>}
   */
  async createOrganization() {
    const organization = new Organization({ provider: this.provider });
    await organization._create();
    return organization;
  }

  /**
   * Can be used with a keyed provider.
   *
   * @param identifierString
   * @returns {Promise<Organization>}
   */
  async loadOrganization(identifierString: Hash) {
    const organization = new Organization({ provider: this.provider });
    await organization._load(identifierString.toBytes());
    return organization;
  }

  /**
   * Should be used with a keyed provider.
   *
   * @returns {Promise<ValidatorNode>}
   */
  async createValidatorNode(organizationIdentifierString: Hash) {
    const validatorNode = new ValidatorNode({ provider: this.provider });
    await validatorNode._create(organizationIdentifierString.toBytes());
    return validatorNode;
  }

  /**
   * Can be used with a keyed provider.
   *
   * @param identifier
   * @returns {Promise<ValidatorNode>}
   */
  async loadValidatorNode(identifier: Hash) {
    const validatorNode = new ValidatorNode({ provider: this.provider });
    await validatorNode._load(identifier.toBytes());
    return validatorNode;
  }

  /**
   * Should be used with a keyed provider.
   *
   * @returns {Promise<Application>}
   */
  async createApplication(organizationIdentifierString: Hash) {
    const application = new Application({ provider: this.provider });
    await application._create(organizationIdentifierString.toBytes());
    return application;
  }

  /**
   * Can be used with a keyed provider.
   *
   * @param identifier
   * @returns {Promise<Application>}
   */
  async loadApplication(identifier: Hash) {
    const application = new Application({ provider: this.provider });
    await application._load(identifier.toBytes());
    return application;
  }

  /**
   * Should be used with a keyed provider.
   *
   * @param object {RecordDescription}
   * @returns {Promise<ApplicationLedger>}
   */
  async getApplicationLedgerFromJson(object: RecordDescription) {
    const applicationLedger = new ApplicationLedger({ provider: this.provider });
    await applicationLedger._processJson(object);
    return applicationLedger;
  }

  /**
   * Imports a proof.
   */
  async importApplicationLedgerProof(proof: any) {
    const applicationLedger = new ApplicationLedger({ provider: this.provider });
    await applicationLedger._load(Utils.binaryFromHexa(proof.info.virtualBlockchainIdentifier));
    const data = await applicationLedger.importProof(proof);
    return data;
  }

  /**
   * Should be used with a keyed provider.
   *
   * @returns {Promise<ApplicationLedger>}
   */
  async createApplicationLedger() {
    if (!this.provider.isKeyed()) throw 'Cannot create application ledger without a keyed provider.'
    const applicationLedger = new ApplicationLedger({ provider: this.provider });
    // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
    await applicationLedger._create();
    return applicationLedger;
  }

  /**
   * Can be used with a keyed provider.
   *
   * @param identifier
   * @returns {Promise<ApplicationLedger>}
   */
  async loadApplicationLedger(identifier: Hash) {
    const applicationLedger = new ApplicationLedger({ provider: this.provider });
    await applicationLedger._load(identifier.toBytes());
    return applicationLedger;
  }
}
