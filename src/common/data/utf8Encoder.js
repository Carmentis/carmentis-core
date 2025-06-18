const encoder = new TextEncoder();
const decoder = new TextDecoder();

export const Utf8Encoder = {
  encode,
  decode
};

function encode(str) {
  return encoder.encode(str);
}

function decode(array) {
  return decoder.decode(array);
}
