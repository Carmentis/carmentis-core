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

function processQrCode(qrData) {
  console.log("processQrCode", qrData);

  let privateKey = Carmentis.crypto.generateKey256();

  wiWallet = new Carmentis.wiWallet(privateKey, uiCallback);

  wiWallet.processQrCode(qrData);
}

async function uiCallback(type, object) {
  console.log("uiCallback", type, object);

  return true;
}
