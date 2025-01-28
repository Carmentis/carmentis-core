let wiWallet;

async function scanQRCode() {
  let qrData = wiClient.getQrData("output");

  wiWallet = new Carmentis.wiWallet;

  wiWallet.processQrCode(qrData);
}
