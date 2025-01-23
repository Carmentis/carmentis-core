import * as sdk from "../../server/sdk.js";
import * as CFG from "./config.js";
import { log, outcome } from "../logger.js";

import { spawn } from "child_process";

const { wiClientNodeJs } = sdk.walletInterface;

export async function run() {
  log("--- Testing Wallet Interface ----");

  await runProcess("test-sdk-walletInterface/operator.js", "operator", runWallet);
}

async function runWallet() {
  await runProcess("test-sdk-walletInterface/wallet.js", "wallet", runTests);
}

async function runTests() {
  let wi = new wiClientNodeJs();

  wi.attachQrCodeContainer("");
  wi.setServerUrl(CFG.OPERATOR_URL);
  wi.process({});
}

function runProcess(path, name, onReadyCallback) {
  return new Promise(function(resolve, reject) {
    const process = spawn("node", [ path ]);

    process.stdout.on("data", async (data) => {
      data = data.toString().replace(/\n$/, "");
      console.log(`(${name}) ${data.split(/\r?\n/).join(`\n(${name}) `)}`);

      if(/^ready/.test(data)) {
        await onReadyCallback();
//      console.log(`killing ${name}`);
//      process.kill();
      }
    });

    process.stderr.on("data", (data) => {
      data = data.toString().replace(/\n$/, "");
      console.error(`(${name}) ${data.split(/\r?\n/).join(`\n(${name}) `)}`);
    });

    process.on("close", (code) => {
      console.log(`${name} terminated`);
      resolve();
    });
  });
}
