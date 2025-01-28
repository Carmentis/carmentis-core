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

  wiWallet = new Carmentis.wiWallet;

  wiWallet.processQrCode(qrData);
}
