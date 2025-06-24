import { Provider } from "../providers/provider.js";
import { Explorer } from "./explorer.js";
import { MicroblockImporter } from "./microblockImporter.js";
import { Account } from "./account.js";
import { Organization } from "./organization.js";
import { Application } from "./application.js";
import { ApplicationLedger } from "./applicationLedger.js";
import { Utils } from "../utils/utils.js";

export class Blockchain {
  constructor(provider) {
    this.provider = provider;
  }

  getExplorer() {
    return new Explorer({ provider: this.provider });
  }

  getMicroblockImporter(data) {
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
  async createAccount(sellerAccount, buyerPublicKey, amount) {
    if (!this.provider.isKeyed()) throw 'Cannot create an account without a keyed provider.'
    const account = new Account({ provider: this.provider });
    await account._create(Utils.binaryFromHexa(sellerAccount), buyerPublicKey, amount);
    return account;
  }

  /**
   * Can be used with a keyed provider.
   *
   * @param identifierString
   * @returns {Promise<Account>}
   */
  async loadAccount(identifierString) {
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
  async loadOrganization(identifierString) {
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
    await application._create();
    return application;
  }

  /**
   * Can be used with a keyed provider.
   *
   * @param identifierString
   * @returns {Promise<Application>}
   */
  async loadApplication(identifierString) {
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
  async getApplicationLedgerFromJson(object) {
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
    await applicationLedger._create();
    return applicationLedger;
  }

  /**
   * Can be used with a keyed provider.
   *
   * @param identifierString
   * @returns {Promise<ApplicationLedger>}
   */
  async loadApplicationLedger(identifierString) {
    const applicationLedger = new ApplicationLedger({ provider: this.provider });
    await applicationLedger._load(Utils.binaryFromHexa(identifierString));
    return applicationLedger;
  }
}
