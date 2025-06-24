import { NetworkProvider } from "./networkProvider";

export class BrowserNetworkProvider extends NetworkProvider {
  constructor(nodeUrl: any) {
    super(nodeUrl);
  }

  // @ts-expect-error TS(2416): Property 'query' in type 'BrowserNetworkProvider' ... Remove this comment to see the full error message
  async query(urlObject: any) {
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
