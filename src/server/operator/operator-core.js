import { blockchainCore, ROLES, appLedgerVb } from "../../common/blockchain/blockchain.js";

// ============================================================================================================================ //
//  initialize()                                                                                                                //
// ============================================================================================================================ //
export function initialize(nodeUrl, operatorPrivateKey) {
  blockchainCore.setNode(nodeUrl);
  blockchainCore.setUser(ROLES.OPERATOR, operatorPrivateKey);
}

// ============================================================================================================================ //
//  prepareUserApproval()                                                                                                       //
// ============================================================================================================================ //
export async function prepareUserApproval(approvalObject) {
  console.log("prepareUserApproval");

  let vb, mb;

  vb = new appLedgerVb();

  console.log("generateDataSections");
  await vb.generateDataSections(approvalObject, false);

  console.log("getMicroblockData");
  mb = vb.getMicroblockData();

  console.log(mb);

  return "OK";
}
