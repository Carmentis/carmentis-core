window.carmentisWallet = {
  openPopup(data) {
    processMessage(data);
  }
}

function processMessage(data) {
  console.log("processMessage", data);

  let privateKey = Carmentis.crypto.generateKey256();

  let wiWallet = new Carmentis.wiExtensionWallet(privateKey);

  let req = wiWallet.getRequestFromMessage(data);

  console.log("getRequestFromMessage", req);

  let answer = wiWallet.approveRequestExecution(req);

  window.parent.postMessage(
    {
      data: answer,
      from: "CarmentisWallet"
    },
    "*"
  );
}
