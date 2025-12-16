import {ApplicationCreationSection, SignatureSection} from "./sections";
import {SectionType} from "./SectionType";
import {Utils} from "../../../../utils/utils";

describe("Section encoding and decoding", () => {
    it('Should encode and decode an application creation section',  () => {
        const appCreationSection : ApplicationCreationSection = {
            organizationId: Utils.getNullHash(),
            type: SectionType.APP_CREATION,
        };
    })

    it("Should create a signature section and should be switched with an organization signature", () => {
        const sigSection: SignatureSection = {
            type: SectionType.SIGNATURE,
            signature: Utils.getNullHash(),
            schemeId: 1,
        }
    })
})