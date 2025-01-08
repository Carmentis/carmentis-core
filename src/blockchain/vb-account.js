import { ERRORS, ID, SECTIONS } from "../constants/constants.js";
import { virtualBlockchain } from "./virtualBlockchain.js";
import { sectionError, accountError } from "../errors/error.js";

// ============================================================================================================================ //
//  accountVb                                                                                                                   //
// ============================================================================================================================ //
export class accountVb extends virtualBlockchain {
  constructor() {
    super(ID.OBJ_ACCOUNT);

    this.state.payees = [];
    this.state.nextPayeeId = 0;
  }

  async addTokenIssuance(object) {
    await this.addSection(SECTIONS.ACCOUNT_TOKEN_ISSUANCE, object);
  }

  async create(object) {
    await this.addSection(SECTIONS.ACCOUNT_CREATION, object);
  }

  createTransfer(payeeAccount, amount) {
    let object = {
      amount: amount
    };

    return {
      addPublicReference: ref => object.publicReference = ref,
      addPrivateReference: ref => object.privateReference = ref,

      commit: async () => {
        object.payeeId = this.state.payees.indexOf(payeeAccount);

        if(object.payeeId == -1) {
          object.payeeId = this.state.nextPayeeId;
          await this.addSection(SECTIONS.ACCOUNT_PAYEE_DECLARATION, { id: object.payeeId, account: payeeAccount });
        }

        await this.addSection(SECTIONS.ACCOUNT_TRANSFER, object);
      }
    };
  }

  async sign() {
    await this.addSignature(this.getKey(SECTIONS.KEY_USER, 0), SECTIONS.ACCOUNT_SIGNATURE);
  }

  async updateState(mb, ndx, sectionId, object) {
    switch(sectionId) {
      case SECTIONS.ACCOUNT_TOKEN_ISSUANCE: {
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

      case SECTIONS.ACCOUNT_PAYEE_DECLARATION: {
        this.state.payees[object.id] = object.account;
        this.state.nextPayeeId = this.state.nextPayeeId + 1 & 0xFF;

        let payeeVb = new accountVb();

        await payeeVb.load(object.account);

        if(!this.constructor.isNode()) {
          this.setKey(
            SECTIONS.KEY_PAYER_PAYEE,
            object.id,
            this.getSharedKey(
              this.getKey(SECTIONS.KEY_USER, 0),
              payeeVb.state.publicKey
            )
          );
        }
        break;
      }

      case SECTIONS.ACCOUNT_TRANSFER: {
        if(!this.state.publicKey) {
          throw new accountError(ERRORS.ACCOUNT_KEY_UNDEFINED);
        }
        if(!this.state.payees[object.payeeId]) {
          throw new accountError(ERRORS.ACCOUNT_PAYEE_UNDEFINED, object.payeeId);
        }
        break;
      }

      case SECTIONS.ACCOUNT_SIGNATURE: {
        let creationSection = mb.sections.find(section => section.id == SECTIONS.ACCOUNT_CREATION);

        if(creationSection) {
          // an account creation is signed by the seller
          let sellerVb = new accountVb();
          await sellerVb.load(creationSection.object.sellerAccount);

          this.verifySignature(mb, sellerVb.state.publicKey, object);
        }
        else {
          // everything else is signed by the account owner
          this.verifySignature(mb, this.state.publicKey, object);
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
