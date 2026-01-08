import {WalletInteractiveAnchoringRequest, WalletInteractiveAnchoringRequestSchema} from "../zod/walletOperatorMessages/Schemas";
import {decode, encode} from "cbor-x";
import {WalletInteractiveAnchoringResponse, WalletInteractiveAnchoringResponseSchema} from "../zod/walletOperatorMessages/Schemas";
import * as v from 'valibot';


export class WalletInteractiveAnchoringEncoder {
    static encodeRequest(request: WalletInteractiveAnchoringRequest) {
        return encode(v.parse(WalletInteractiveAnchoringRequestSchema, request));
    }

    static decodeRequest(request: Uint8Array) {
        return v.parse(WalletInteractiveAnchoringRequestSchema, decode(request));
    }

    static encodeResponse(response: WalletInteractiveAnchoringResponse) {
        return encode(v.parse(WalletInteractiveAnchoringResponseSchema, response));
    }

    static decodeResponse(response: Uint8Array) {
        const decodedResponse = decode(response);
        return v.parse(WalletInteractiveAnchoringResponseSchema, decodedResponse);
    }
}
