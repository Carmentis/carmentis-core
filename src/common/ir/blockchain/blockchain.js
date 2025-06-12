import { Provider } from "../providers/provider.js";
import { NullProvider } from "../providers/nullProvider.js";
import { Explorer } from "./explorer.js";
import { Account } from "./account.js";
import { Organization } from "./organization.js";
import { Application } from "./application.js";
import { ApplicationLedger } from "./applicationLedger.js";

export class Blockchain {
  constructor(args = {}) {
    this.provider = new Provider(
      new (args.internalProvider || NullProvider),
      new (args.externalProvider || NullProvider)
    );
  }

  getExplorerInstance() {
    return new Explorer({ provider: this.provider });
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
