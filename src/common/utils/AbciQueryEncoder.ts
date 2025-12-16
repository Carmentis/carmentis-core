import {AbciRequest, AbciRequestSchema} from "../type/valibot/provider/abci/AbciRequest";
import {encode, decode} from "cbor-x";
import {AbciResponse, AbciResponseSchema, AbciResponseType} from "../type/valibot/provider/abci/AbciResponse";
import * as v from 'valibot';


export class AbciQueryEncoder {
    static encodeAbciRequest(request: AbciRequest) {
        return encode(request)
    }

    static decodeAbciRequest(request: Uint8Array) {
        return v.parse(AbciRequestSchema, decode(request));
    }

    static encodeAbciResponse(response: AbciResponse) {
        return encode(response);
    }

    static decodeAbciResponse(response: Uint8Array) {
        return v.parse(AbciResponseSchema, decode(response));
    }
}