import {CarmentisError} from "../errors/carmentis-error";

import {SectionDataSchema, SectionSchema, SectionType} from "../proto/section";
export class Section<T = any> {
    constructor(private sectionSchema: SectionSchema) {}

    static createFromSchema<T>( sectionSchema: SectionSchema ) : Section<T> {
        return new Section<T>(sectionSchema)
    }

    static createFromData<T>(sectionType: SectionType, data: SectionDataSchema): Section<T> {
        return new Section(SectionSchema.create({
            sectionType: sectionType,
            data: data
        }));
    }

    export(): Uint8Array {
        return SectionSchema.encode(this.sectionSchema).finish();
    }

    /**
     * Retrieves the type of the section.
     *
     * @return {SectionType} The type of the section.
     */
    getSectionType(): SectionType {
        return this.sectionSchema.sectionType;
    }

    /**
     * Checks if the provided sectionType matches the sectionType of the section schema.
     *
     * @param {SectionType} sectionType - The type of the section to compare against the section schema's sectionType.
     * @return {boolean} Returns true if the provided sectionType matches the sectionType of the section schema, otherwise false.
     */
    isSectionType(sectionType: SectionType): boolean {
        return this.sectionSchema.sectionType === sectionType;
    }

    /**
     * Retrieves the stored data.
     *
     * @return {T} The data stored in the instance.
     */
    getData(): T {
        const data = this.sectionSchema.data;
        if (data === undefined) throw new CarmentisError("Undefined data in section");
        return data as T;
    }
}







