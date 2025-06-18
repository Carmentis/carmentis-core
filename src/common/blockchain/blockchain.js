import { Provider } from "../providers/provider.js";
import { Explorer } from "./explorer.js";
import { MicroblockImporter } from "./microblockImporter.js";
import { Account } from "./account.js";
import { Organization } from "./organization.js";
import { Application } from "./application.js";
import { ApplicationLedger } from "./applicationLedger.js";

export class Blockchain {
  constructor(args = {}) {
    this.provider = new Provider(
      args.internalProvider,
      args.externalProvider
    );
  }

  getExplorer() {
    return new Explorer({ provider: this.provider });
  }

  getMicroblockImporter(data) {
    return new MicroblockImporter({ data, provider: this.provider });
  }

  async createGenesisAccount(keyPair) {
    const account = new Account({ ...keyPair, provider: this.provider });
    await account._createGenesis();
    return account;
  }

  async createAccount(keyPair, sellerAccount, buyerPublicKey, amount) {
    const account = new Account({ ...keyPair, provider: this.provider });
    await account._create(sellerAccount, buyerPublicKey, amount);
    return account;
  }

  async loadAccount(identifier, keyPair) {
    const account = new Account({ ...keyPair, provider: this.provider });
    await account._load(identifier);
    return account;
  }

  async createOrganization(keyPair) {
    const organization = new Organization({ ...keyPair, provider: this.provider });
    await organization._create();
    return organization;
  }

  async loadOrganization(identifier, keyPair) {
    const organization = new Organization({ ...keyPair, provider: this.provider });
    await organization._load(identifier);
    return organization;
  }

  async createApplication(keyPair) {
    const application = new Application({ ...keyPair, provider: this.provider });
    await application._create();
    return application;
  }

  async loadApplication(identifier, keyPair) {
    const application = new Application({ ...keyPair, provider: this.provider });
    await application._load(identifier);
    return application;
  }

  async getApplicationLedgerFromJson(keyPair, object) {
    const applicationLedger = new ApplicationLedger({ ...keyPair, provider: this.provider });
    await applicationLedger._processJson(object);
    return applicationLedger;
  }

  async createApplicationLedger(keyPair) {
    const applicationLedger = new ApplicationLedger({ ...keyPair, provider: this.provider });
    await applicationLedger._create();
    return applicationLedger;
  }

  async loadApplicationLedger(identifier, keyPair) {
    const applicationLedger = new ApplicationLedger({ ...keyPair, provider: this.provider });
    await applicationLedger._load(identifier);
    return applicationLedger;
  }
}
