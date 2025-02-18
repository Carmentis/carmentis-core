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

  let answer;

  switch(req.type) {
    case SCHEMAS.WIRQ_AUTH_BY_PUBLIC_KEY: {
      answer = wiWallet.signAuthenticationByPublicKey(privateKey, req.object);
      break;
    }
    case SCHEMAS.WIRQ_DATA_APPROVAL: {
      answer = await wiWallet.getApprovalData(privateKey, req.object);
      break;
    }
  }

  window.parent.postMessage(
    {
      data: answer,
      from: "carmentis/walletResponse"
    },
    "*"
  );
}
