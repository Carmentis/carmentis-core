window.carmentisWallet = {
  openPopup(data) {
    processMessage(data);
  }
}

function processMessage(data) {
  console.log("processMessage", data);

  let privateKey = Carmentis.crypto.generateKey256();

  let wiWallet = new Carmentis.wiExtensionWallet();

  let req = wiWallet.getRequestFromMessage(data);

  console.log("getRequestFromMessage", req);

  let answer = wiWallet.signAuthenticationByPublicKey(privateKey, req.object);

  window.parent.postMessage(
    {
      data: answer,
      from: "carmentis/walletResponse"
    },
    "*"
  );
}
