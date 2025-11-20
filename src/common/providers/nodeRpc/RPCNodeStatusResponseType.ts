import {RPCNodeStatusResponseSchema} from "./RPCNodeStatusResponseSchema";
import {z} from "zod";

export type RPCNodeStatusResponseType = z.infer<typeof RPCNodeStatusResponseSchema>;