import { io } from "../../node-modules/socket.io-client/dist/socket.io.esm.min.js";
import * as clientSocket from "./wiClientSocket.js";
export { wiClient as wiClientBrowser } from "./wiClient.js";

clientSocket.setIo(io);
