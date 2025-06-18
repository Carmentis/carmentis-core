import { NetworkProvider } from "./networkProvider.js";

export class BrowserNetworkProvider extends NetworkProvider {
  constructor(nodeUrl) {
    super(nodeUrl);
  }

  async query(urlObject) {
    const netXhr = new XMLHttpRequest();

    return new Promise(function(resolve, reject) {
      const url = urlObject.toString();

      netXhr.open("POST", url, true);

      netXhr.setRequestHeader("Accept", "application/json");
      netXhr.setRequestHeader("Content-Type", "application/json; charset=utf-8");

      netXhr.addEventListener("load", () => {
        resolve(netXhr.response);
      });

      netXhr.addEventListener("error", (error) => {
        reject(error);
      });

      netXhr.send();
    });
  }
}
