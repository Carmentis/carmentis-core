import { Provider } from "../providers/provider";
import { Explorer } from "./explorer";
import { MicroblockImporter } from "./microblockImporter";
import { Account } from "./account";
import { Organization } from "./organization";
import { Application } from "./application";
import { ApplicationLedger } from "./applicationLedger";
import { Utils } from "../utils/utils";
import {EncoderFactory} from "../utils/encoder";

export class Blockchain {
  provider: any;
  constructor(provider: any) {
    this.provider = provider;
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
   * @param {string} sellerAccount
   * @param {PublicSignatureKey} buyerPublicKey
   * @param {number} amount
   * @returns {Promise<Account>}
   */
  async createAccount(sellerAccount: string, buyerPublicKey: any, amount: any) {
    if (!this.provider.isKeyed()) throw 'Cannot create an account without a keyed provider.'
    const hexEncoder = EncoderFactory.bytesToHexEncoder();
    const account = new Account({ provider: this.provider });
    await account._create(hexEncoder.decode(sellerAccount), buyerPublicKey, amount);
    return account;
  }

  /**
   * Can be used with a keyed provider.
   *
   * @param identifierString
   * @returns {Promise<Account>}
   */
  async loadAccount(identifierString: any) {
    const account = new Account({ provider: this.provider });
    await account._load(Utils.binaryFromHexa(identifierString));
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
  async loadOrganization(identifierString: any) {
    const organization = new Organization({ provider: this.provider });
    await organization._load(Utils.binaryFromHexa(identifierString));
    return organization;
  }

  /**
   * Should be used with a keyed provider.
   *
   * @returns {Promise<Application>}
   */
  async createApplication() {
    const application = new Application({ provider: this.provider });
    // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
    await application._create();
    return application;
  }

  /**
   * Can be used with a keyed provider.
   *
   * @param identifierString
   * @returns {Promise<Application>}
   */
  async loadApplication(identifierString: any) {
    const application = new Application({ provider: this.provider });
    await application._load(Utils.binaryFromHexa(identifierString));
    return application;
  }

  /**
   * Should be used with a keyed provider.
   *
   * @param object
   * @returns {Promise<ApplicationLedger>}
   */
  async getApplicationLedgerFromJson(object: any) {
    const applicationLedger = new ApplicationLedger({ provider: this.provider });
    await applicationLedger._processJson(object);
    return applicationLedger;
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
   * @param identifierString
   * @returns {Promise<ApplicationLedger>}
   */
  async loadApplicationLedger(identifierString: any) {
    const applicationLedger = new ApplicationLedger({ provider: this.provider });
    await applicationLedger._load(Utils.binaryFromHexa(identifierString));
    return applicationLedger;
  }
}
