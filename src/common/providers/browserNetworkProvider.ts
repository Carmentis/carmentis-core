import { NetworkProvider } from "./networkProvider";
import axios from "axios";

export class BrowserNetworkProvider extends NetworkProvider {
  constructor(nodeUrl: any) {
    super(nodeUrl);
  }

  async query2(urlObject: any) {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await axios.post(urlObject, {}, {
          headers: {
            'Content-Type': 'application/json; charset=UTF-8',
            'Accept': 'application/json',
          }
        });
        return resolve(response.data);
      } catch (e) {
        reject(e);
      }
    })


    /*
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

     */
  }
}
