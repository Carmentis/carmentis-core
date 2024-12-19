export function log(msg) {
  console.log(msg);
}

export function outcome(title, padding, success, info) {
  console.log((title + " ").padEnd(padding, ".") + " " + (success ? "OK" + (info ? ` (${info})` : "") : "FAILED"));
}
