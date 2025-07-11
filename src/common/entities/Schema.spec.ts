import {AppDescriptionSectionSchema, SectionSchema, SectionType} from "../proto/section";

import {Hash} from "./Hash";


describe('Schema', () => {
    it('test', () => {
        const sectionData = AppDescriptionSectionSchema.create({
            name: 'test',
            description: '',
            homepageUrl: '',
            logoUrl: ''
        });

        const encoded = AppDescriptionSectionSchema.encode(sectionData).finish();
        const decoded = AppDescriptionSectionSchema.decode(encoded);
        console.log(Hash.from(encoded).encode(), decoded)


        const section = SectionSchema.create({
            sectionType: SectionType.APP_DESCRIPTION,
            data: {
                orgDescription: {},
                appDescription: sectionData,
            }
        });
        const encodedSection = SectionSchema.encode(section).finish();
        const decodedSection = SectionSchema.decode(encodedSection);
        console.log(encodedSection.length, decodedSection)


    })
});