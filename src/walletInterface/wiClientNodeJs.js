import { io } from "socket.io-client";
import * as clientSocket from "./wiClientSocket.js";
export { wiClient as wiClientNodeJs } from "./wiClient.js";

clientSocket.setIo(io);
