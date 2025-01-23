import * as logger from "./logger.js";
import * as testFieldSerializer from "./test-fieldSerializer/test-fieldSerializer.js";
import * as testSchemaSerializer from "./test-schemaSerializer/test-schemaSerializer.js";
import * as testSectionSerializer from "./test-sectionSerializer/test-sectionSerializer.js";
import * as testSdkBlockchain from "./test-sdk-blockchain/test-sdk-blockchain.js";
//import * as testSdkWalletInterface from "./test-sdk-walletInterface/test-sdk-walletInterface.js";

(async function() {
  logger.log("==== UNIT TESTS ====");

  await testFieldSerializer.run();
  logger.log("");

  await testSchemaSerializer.run();
  logger.log("");

  await testSectionSerializer.run();
  logger.log("");

  await testSdkBlockchain.run();
  logger.log("");

//await testSdkWalletInterface.run();
})();
