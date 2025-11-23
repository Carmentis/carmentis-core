import {WalletOperatorMessageType, WalletOperatorRequestApprovalHandshake} from "./Schemas";

describe("WalletOperator message", () => {
    it("should correctly parse and retrieve a type of a message", () => {
        const request: WalletOperatorRequestApprovalHandshake = {
            anchorRequestId: "12",
            type: WalletOperatorMessageType.WALLET_OPERATOR_REQUEST_APPROVAL_HANDSHAKE
        };
    })
})