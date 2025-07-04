import {ECO} from "../constants/constants";

export const Economics = {
  specialAccountIdentifierToType,
  specialAccountTypeToIdentifier
};

function specialAccountIdentifierToType(accountIdentifier: Uint8Array): number {
  if(accountIdentifier.length != 32) {
    throw `invalid account identifier`;
  }
  if(accountIdentifier.slice(0, -1).every((v: number) => v == 0x00)) {
    const type = accountIdentifier[31];

    if(ECO.SPECIAL_ACCOUNT_NAMES[type]) {
      return type;
    }
  }
  return -1;
}

function specialAccountTypeToIdentifier(type: number): Uint8Array {
  if(!ECO.SPECIAL_ACCOUNT_NAMES[type]) {
    throw `${type} is not a valid special account type`;
  }
  const identifier = new Uint8Array(32);
  identifier[31] = type;
  return identifier;
}
