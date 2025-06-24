import http from "http";
import https from "https";
import { NetworkProvider } from "./networkProvider";
import { Utils } from "../utils/utils";

export class ServerNetworkProvider extends NetworkProvider {
  constructor(nodeUrl: any) {
    super(nodeUrl);
  }

  // @ts-expect-error TS(2416): Property 'query' in type 'ServerNetworkProvider' i... Remove this comment to see the full error message
  async query(urlObject: any) {
    console.log("network query", Utils.truncateString(urlObject.toString(), 80));

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
  }
}
