import {describe, expect, test} from '@jest/globals';
import {Provider} from "../common/providers/Provider";
import {KeyedProvider} from "../common/providers/KeyedProvider";
import {MemoryProvider} from "../common/providers/MemoryProvider";
import {Blockchain} from "../common/blockchain/blockchain";
import {IntermediateRepresentation} from "../common/records/intermediateRepresentation";
import {DATA, ECO} from '../common/constants/constants';
import {MLDSA65PrivateSignatureKey} from "../common/crypto/signature/ml-dsa-65";
import {EncoderFactory} from "../common/utils/encoder";
import {Crypto} from "../common/crypto/crypto";
import {Hash} from "../common/entities/Hash";
import {NetworkProvider} from "../common/providers/NetworkProvider";
import {BlockchainFacade} from "../common/providers/BlockchainFacade";
import {PublicationExecutionContext} from "../common/providers/publicationContexts/PublicationExecutionContext";
import {
    AccountPublicationExecutionContext
} from "../common/providers/publicationContexts/AccountPublicationExecutionContext";
import {CMTSToken} from "../common/economics/currencies/token";
import {
    AccountTransferPublicationExecutionContext
} from "../common/providers/publicationContexts/AccountTransferPublicationExecutionContext";
import {
    OrganisationPublicationExecutionContext
} from "../common/providers/publicationContexts/OrganisationPublicationExecutionContext";
import {
    ApplicationPublicationExecutionContext
} from "../common/providers/publicationContexts/ApplicationPublicationExecutionContext";
import {
    RecordPublicationExecutionContext
} from "../common/providers/publicationContexts/RecordPublicationExecutionContext";
import {CarmentisError} from "../common/errors/carmentis-error";

const NODE_URL = "http://localhost:26657";

describe('Chain test', () => {
    test('testIr()', async () => {
        let ir, testObject, sectionData;

        testObject =
            {
                someString: "Hello, world!",
                email: "john.doe@gmail.com",
                someObject: {
                    someStringProp: "As we travel the universe 🪐",
                    someNumberArrayProp: [ 123, 456, 78.9 ],
                    someObjectArrayProp: [ { name: "a" }, { name: "b" }, { name: "c" } ],
                    someNullProp: null,
                    someBooleanProp: true
                }
            };

        ir = new IntermediateRepresentation;
        ir.addPrivateChannel(0);
        ir.addPrivateChannel(1);

        ir.buildFromJson(testObject);
        ir.setChannel("this.*", 0);
        ir.setChannel("this.someObject.someStringProp, this.someObject.someNullProp", 1);
        ir.setAsMaskableByRegex("this.email", /^(.)(.*?)(@.)(.*?)(\..*)$/, "$1***$3***$5");
        ir.serializeFields();
        ir.populateChannels();

        sectionData = ir.exportToSectionFormat();
        console.log("sectionData", sectionData);

        ir.setAsRedacted("this.someObject.someNumberArrayProp[*]");

        const proof1 = ir.exportToProof();
        console.log("proof 1", JSON.stringify(proof1, null, 2));

        ir = new IntermediateRepresentation;
        ir.addPrivateChannel(0);
        ir.addPrivateChannel(1);
        console.log(ir.importFromProof(proof1));
        ir.setAsMasked("this.email");
        const proof2 = ir.exportToProof();
        console.log("proof 2", JSON.stringify(proof2, null, 2));

        ir = new IntermediateRepresentation;
        ir.addPrivateChannel(0);
        ir.addPrivateChannel(1);
        console.log(ir.importFromProof(proof2));
        ir.setAsRedacted("this.email");
        ir.setAsRedacted("this.someObject.someStringProp");
        const proof3 = ir.exportToProof();
        console.log("proof 3", JSON.stringify(proof3, null, 2));

        ir = new IntermediateRepresentation;
        ir.addPrivateChannel(0);
        ir.addPrivateChannel(1);
        console.log(ir.importFromProof(proof3));

        console.log("exportToJson", JSON.stringify(ir.exportToJson(), null, 2));

        ir = new IntermediateRepresentation;
        ir.addPrivateChannel(0);
        ir.addPrivateChannel(1);

        ir.importFromSectionFormat(sectionData);
        console.log("recovered from sections", JSON.stringify(ir.exportToJson(), null, 2));
    })
});
