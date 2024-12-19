import { ERRORS, ERROR_TYPES, SCHEMAS } from "../constants/constants.js";
import * as schemaSerializer from "../serializers/schema-serializer.js";
import * as util from "../util/util.js";

let language = "EN";
 
export class CarmentisError extends Error {
  constructor(type, id, ...arg) {
    let msg = errorMessage(type, id, arg);

    super(msg);
    this.type = type;
    this.id = id;
    this.arg = arg;
  }

  static setLanguage(str) {
    if(ERRORS.MSG[str]) {
      language = str;
    }
  }

  log() {
    if(this.stack) {
      console.error(this.stack);
    }
    else {
      console.error(errorMessage(this.type, this.id, this.arg));
    }
  }

  serializeAsMessage() {
    return schemaSerializer.encodeMessage(
      SCHEMAS.MSG_ANS_ERROR,
      {
        error: {
          type: this.type,
          id  : this.id,
          arg : this.arg.map(String)
        }
      }
    );
  }
}

export class globalError       extends CarmentisError { constructor(...arg) { super(ERROR_TYPES.GLOBAL,       ...arg); } }
export class fieldError        extends CarmentisError { constructor(...arg) { super(ERROR_TYPES.FIELD,        ...arg); } }
export class schemaError       extends CarmentisError { constructor(...arg) { super(ERROR_TYPES.SCHEMA,       ...arg); } }
export class sectionError      extends CarmentisError { constructor(...arg) { super(ERROR_TYPES.SECTION,      ...arg); } }
export class pathError         extends CarmentisError { constructor(...arg) { super(ERROR_TYPES.PATH,         ...arg); } }
export class blockchainError   extends CarmentisError { constructor(...arg) { super(ERROR_TYPES.BLOCKCHAIN,   ...arg); } }
export class accountError      extends CarmentisError { constructor(...arg) { super(ERROR_TYPES.ACCOUNT,      ...arg); } }
export class nodeError         extends CarmentisError { constructor(...arg) { super(ERROR_TYPES.NODE,         ...arg); } }
export class organizationError extends CarmentisError { constructor(...arg) { super(ERROR_TYPES.ORGANIZAYION, ...arg); } }
export class appUserError      extends CarmentisError { constructor(...arg) { super(ERROR_TYPES.APP_USER,     ...arg); } }
export class applicationError  extends CarmentisError { constructor(...arg) { super(ERROR_TYPES.APPLICATION,  ...arg); } }
export class appLedgerError    extends CarmentisError { constructor(...arg) { super(ERROR_TYPES.APP_LEDGER,   ...arg); } }
export class oracleError       extends CarmentisError { constructor(...arg) { super(ERROR_TYPES.ORACLE,       ...arg); } }

export function cryptoErrorHandler(e) {
  throw e.isCarmentisError ?
    e
  :
    new globalError(ERRORS.GLOBAL_CRYPTO_ERROR, e.toString().replace(/^Error: /, ""));
}

function errorMessage(type, id, arg) {
  let prefix = type & ERROR_TYPES.REMOTE_ERROR ? "[REMOTE ERROR] " : "";

  prefix += `(0x${util.hexa(type << 8 | id, 4)}) `;

  type &= ERROR_TYPES.TYPE_MASK;

  if(!ERRORS.MSG[language][type] || !ERRORS.MSG[language][type][id]) {
    return prefix + `ill-formed error type=${type}, id=${id}`;
  }

  return prefix + ERRORS.MSG[language][type][id].replace(/(%\d+)/g, s => arg[s.slice(1)]);
}
