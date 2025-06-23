import { Provider } from "../providers/provider.js";
import { Explorer } from "./explorer.js";
import { MicroblockImporter } from "./microblockImporter.js";
import { Account } from "./account.js";
import { Organization } from "./organization.js";
import { Application } from "./application.js";
import { ApplicationLedger } from "./applicationLedger.js";

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
   * @param {Uint8Array} sellerAccount
   * @param {PublicSignatureKey} buyerPublicKey
   * @param {number} amount
   * @returns {Promise<Account>}
   */
  async createAccount(sellerAccount, buyerPublicKey, amount) {
    if (!this.provider.isKeyed()) throw 'Cannot create an account without a keyed provider.'
    const account = new Account({ provider: this.provider });
    await account._create(sellerAccount, buyerPublicKey, amount);
    return account;
  }

  /**
   * Can be used with a keyed provider.
   *
   * @param identifier
   * @returns {Promise<Account>}
   */
  async loadAccount(identifier) {
    const account = new Account({ provider: this.provider });
    await account._load(identifier);
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
   * @param identifier
   * @returns {Promise<Organization>}
   */
  async loadOrganization(identifier) {
    const organization = new Organization({ provider: this.provider });
    await organization._load(identifier);
    return organization;
  }

  /**
   * Should be used with a keyed provider.
   *
   * @param keyPair
   * @returns {Promise<Application>}
   */
  async createApplication(keyPair) {
    const application = new Application({ ...keyPair, provider: this.provider });
    await application._create();
    return application;
  }

  /**
   * Can be used with a keyed provider.
   *
   * @param identifier
   * @returns {Promise<Application>}
   */
  async loadApplication(identifier) {
    const application = new Application({ provider: this.provider });
    await application._load(identifier);
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
   * @param identifier
   * @returns {Promise<ApplicationLedger>}
   */
  async loadApplicationLedger(identifier) {
    const applicationLedger = new ApplicationLedger({ provider: this.provider });
    await applicationLedger._load(identifier);
    return applicationLedger;
  }
}
