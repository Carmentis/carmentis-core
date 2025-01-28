let wiWallet;

window.addEventListener(
  "message",
  (event) => {
    if(event.data.carmentisMessage) {
      processQrCode(event.data.qrData);
    }
  },
  false,
);

async function processQrCode(qrData) {
  console.log("processQrCode", qrData);

  let privateKey = Carmentis.crypto.generateKey256();

  wiWallet = new Carmentis.wiWallet(privateKey);

  let req = await wiWallet.getRequestInfoFromQrCode(qrData);

  console.log("getRequestInfoFromQrCode", req);

  wiWallet.approveRequestExecution(req);
}
