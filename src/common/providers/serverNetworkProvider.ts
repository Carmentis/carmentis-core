import http from "http";
import https from "https";
import { NetworkProvider } from "./networkProvider";
import { Utils } from "../utils/utils";
import axios from "axios";

export class ServerNetworkProvider extends NetworkProvider {
  constructor(nodeUrl: any) {
    super(nodeUrl);
  }
}
