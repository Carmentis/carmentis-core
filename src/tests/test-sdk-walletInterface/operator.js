import * as http from "http";
import * as CFG from "./config.js";
import { wiServer } from "../../walletInterface/wiServer.js";

const server = http.createServer(function (req, res) {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("hello");
});

server.listen(CFG.OPERATOR_PORT);

const socketServer = new wiServer(server);

console.log("ready");
