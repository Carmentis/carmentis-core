window.carmentisWallet = {
  openPopup(data) {
    processMessage(data);
  }
}

async function processMessage(data) {
  console.log("processMessage", data);

  let privateKey = Carmentis.crypto.generateKey256();

  let wiWallet = new Carmentis.wiExtensionWallet();

  let req = wiWallet.getRequestFromMessage(data);

  console.log("getRequestFromMessage", req);

  switch(req.type) {
    case SCHEMAS.WIRQ_AUTH_BY_PUBLIC_KEY: {
      let answer = wiWallet.signAuthenticationByPublicKey(privateKey, req.object);
      postAnswer(answer);
      break;
    }
    case SCHEMAS.WIRQ_DATA_APPROVAL: {
      let binaryData = await wiWallet.getApprovalData(privateKey, req.object);

      blockchainCore.setUser(ROLES.USER, privateKey);

      let res = await blockchainManager.checkMicroblock(
        binaryData,
        {
          ignoreGas: true
        }
      );

      let vb = res.vb;

      let height, message, record;

      height = vb.getHeight();

      console.log("height", height);

      record = vb.getRecord(height);
      console.log(record);
      console.log(vb.flattenRecord(record));

      message = vb.getApprovalMessage(height);
      console.log(message);

      await vb.signAsEndorser();

      mb = vb.getMicroblockData();

      binaryData = vb.currentMicroblock.binary;

      console.log(binaryData);
/*
      let answer = await wiWallet.sendSigneData(privateKey, binaryData);

      postAnswer(answer);
*/
      break;
    }
  }
}

function postAnswer(answer) {
  window.parent.postMessage(
    {
      data: answer,
      from: "carmentis/walletResponse"
    },
    "*"
  );
}
