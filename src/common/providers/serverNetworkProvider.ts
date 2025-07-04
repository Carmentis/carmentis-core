import http from "http";
import https from "https";
import { NetworkProvider } from "./networkProvider";
import { Utils } from "../utils/utils";
import axios from "axios";

export class ServerNetworkProvider extends NetworkProvider {
  constructor(nodeUrl: any) {
    super(nodeUrl);
  }

  async query2(urlObject: any) {
    console.log("network query", Utils.truncateString(urlObject.toString(), 80));
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
    return new Promise(function(resolve, reject) {
      const httpModule = urlObject.protocol == "https:" ? https : http;

      const options = {
        hostname: urlObject.hostname,
        port    : urlObject.port,
        path    : urlObject.pathname + urlObject.search,
        method  : "POST",
        headers : {
          "Accept": "application/json"
        },
        body: {}
      };

      const req = httpModule.request(options, (res: any) => {
        const chunks: any = [];

        res.on("data", (chunk: any) => {
          chunks.push(chunk);
        });
        res.on("end", () => {
          const answer = Buffer.concat(chunks).toString();
          resolve(answer);
        });
      });

      req.on("error", (error: any) => {
        reject(error);
      });

      req.end();
    });

     */
  }
}
