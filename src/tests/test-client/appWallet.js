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

  let wiWallet = new Carmentis.wiApplicationWallet(privateKey);

  let data = await Carmentis.wiApplicationWallet.extractDataFromQrCode(qrData);

  console.log("extractDataFromQrCode", data);

  let req = await wiWallet.obtainDataFromServer(data.serverUrl, data.qrId);

  console.log("obtainDataFromServer", req);

  let answer = wiWallet.signAuthenticationByPublicKey(privateKey, req.object);

  console.log("app/answer", answer);
}
