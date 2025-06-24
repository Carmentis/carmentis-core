import { gcm } from "@noble/ciphers/aes";

export const Aes = {
  encryptGcm,
  decryptGcm
};

function encryptGcm(key, data, iv) {
  const stream = gcm(key, iv);
  const encrypted = stream.encrypt(data);

  return encrypted;
}

function decryptGcm(key, data, iv) {
  try {
    const stream = gcm(key, iv);
    const decrypted = stream.decrypt(data);

    return decrypted;
  }
  catch(e) {
    console.error(e);
  }
  return false;
}
