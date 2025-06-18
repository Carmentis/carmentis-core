import http from "http";
import https from "https";
import { NetworkProvider } from "./networkProvider.js";

export class ServerNetworkProvider extends NetworkProvider {
  constructor(nodeUrl) {
    super(nodeUrl);
  }

  async query(urlObject) {
    console.log("network query", urlObject.toString());

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

      const req = httpModule.request(options, (res) => {
        const chunks = [];

        res.on("data", (chunk) => {
          chunks.push(chunk);
        });
        res.on("end", () => {
          const answer = Buffer.concat(chunks).toString();
          resolve(answer);
        });
      });

      req.on("error", (error) => {
        reject(error);
      });

      req.end();
    });
  }
}
