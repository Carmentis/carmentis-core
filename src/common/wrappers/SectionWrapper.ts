import {Section} from "../blockchain/Microblock";
import {Hash} from "../entities/Hash";

export class SectionWrapper {
    static wrap(section: Section<any>) {
        return new SectionWrapper(section);
    }
    private constructor(private readonly section: Section<any>) {}

    getSizeInBytes(): number {
        return this.section.data.length;
    }

    getSectionId(): number {
        return this.section.index;
    }

    getSectionHash(): Hash {
        return Hash.from(this.section.hash);
    }


}
