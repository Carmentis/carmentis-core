import { ERRORS, ECO, ID, SECTIONS } from "../constants/constants.js";
import { virtualBlockchain } from "./virtualBlockchain.js";
import { sectionError, accountError } from "../errors/error.js";

// ============================================================================================================================ //
//  accountVb                                                                                                                   //
// ============================================================================================================================ //
export class accountVb extends virtualBlockchain {
  constructor(id, externalRef = false) {
    super(ID.OBJ_ACCOUNT, id);

    this.externalRef = externalRef;
  }

  async addTokenIssuance(object) {
    await this.addSection(SECTIONS.ACCOUNT_TOKEN_ISSUANCE, object);
  }

  async create(object) {
    await this.addSection(SECTIONS.ACCOUNT_CREATION, object);
  }

  createTransfer(payeeAccount, amount) {
    let object = {
      account: payeeAccount,
      amount: amount
    };

    return {
      addPublicReference: ref => object.publicReference = ref,
      addPrivateReference: ref => object.privateReference = ref,

      commit: async () => {
        await this.addSection(SECTIONS.ACCOUNT_TRANSFER, object);
      }
    };
  }

  async sign() {
    return await this.addSignature(this.constructor.rootPrivateKey, SECTIONS.ACCOUNT_SIGNATURE);
  }

  async keyManager(keyId, index, object) {
    switch(keyId) {
      case SECTIONS.KEY_PAYER_PAYEE: {
        if(this.externalRef || this.constructor.isNode()) {
          return null;
        }

        let payeeVb = new accountVb(object.account, true);

        await payeeVb.load();

        let payeePublicKey = payeeVb.state.publicKey,
            theirPublicKey;

        switch(this.constructor.rootPublicKey) {
          case this.state.publicKey: {
            // we are the owner of this account -> use the public key of the payee
            theirPublicKey = payeePublicKey;
            break;
          }
          case payeePublicKey: {
            // we are the payee -> use the public key of this account
            theirPublicKey = this.state.publicKey;
            break;
          }
          default: {
            // we are not involved in this transaction
            return null;
          }
        }

        return this.getSharedKey(
          this.constructor.rootPrivateKey,
          theirPublicKey
        );
      }
    }
    return null;
  }

  async updateState(mb, ndx, sectionId, object) {
    switch(sectionId) {
      case SECTIONS.ACCOUNT_TOKEN_ISSUANCE: {
        if(object.amount != ECO.INITIAL_OFFER) {
          throw new accountError(ERRORS.ACCOUNT_BAD_ISSUANCE_AMOUNT);
        }
        if(this.state.publicKey) {
          throw new accountError(ERRORS.ACCOUNT_KEY_DUPLICATE);
        }
        this.state.publicKey = object.issuerPublicKey;
        break;
      }

      case SECTIONS.ACCOUNT_CREATION: {
        if(this.state.publicKey) {
          throw new accountError(ERRORS.ACCOUNT_KEY_DUPLICATE);
        }
        this.state.publicKey = object.buyerPublicKey;
        break;
      }

      case SECTIONS.ACCOUNT_TRANSFER: {
        if(!this.state.publicKey) {
          throw new accountError(ERRORS.ACCOUNT_KEY_UNDEFINED);
        }

        if(!this.externalRef && !this.constructor.isNode()) {
          let payeeVb = new accountVb(object.account, true);

          try {
            await payeeVb.load();
          }
          catch(e) {
            throw new accountError(ERRORS.ACCOUNT_UNKNOWN, object.account);
          }
        }
        break;
      }

      case SECTIONS.ACCOUNT_SIGNATURE: {
        let creationSection = mb.sections.find(section => section.id == SECTIONS.ACCOUNT_CREATION);

        if(creationSection) {
          // an account creation is signed by the seller
          let sellerVb = new accountVb(creationSection.object.sellerAccount, true);

          await sellerVb.load();

          this.verifySignature(mb, sellerVb.state.publicKey, object);
          mb.payerAccount = creationSection.object.sellerAccount;
        }
        else {
          // everything else is signed by the account owner
          this.verifySignature(mb, this.state.publicKey, object);
          mb.payerAccount = this.id;
        }
        break;
      }

      default: {
        throw new sectionError(ERRORS.SECTION_INVALID_ID, sectionId, ID.OBJECT_NAME[ID.OBJ_ACCOUNT]);
        break;
      }
    }
  }

  checkStructure(pattern) {
    return SECTIONS.ACCOUNT_STRUCTURE.test(pattern);
  }
}
