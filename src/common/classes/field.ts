import {FieldCategory} from "./field-category";
import * as util from '../util/data';
import * as constants from '../constants/data';
import {FieldInterface} from "./field-interface";


export class Field {
    private field: FieldInterface;


    static build(fieldJson: FieldInterface): Field {
        // Validate required properties from the JSON object
        if (!fieldJson.name || !fieldJson.type) {
            throw new Error("Invalid field JSON: 'name' and 'type' are required.");
        }

        // Construct object from the JSON
        const fieldDefinition: FieldInterface = {
            name: fieldJson.name,
            type: fieldJson.type,
            structType: fieldJson.structType,
            maskId: fieldJson.maskId
        };

        // Return a new Field instance
        return new Field(fieldDefinition);
    }

    constructor(field: FieldInterface) {
        this.field = field;
    }

    getName(): string {
        return this.field.name;
    }

    isPublic(): boolean {
        return !util.isPrivate(this.field.type);
    }

    isPrivate(): boolean {
        return !this.isPublic();
    }

    isRequired(): boolean {
        return !this.isOptional();
    }

    isOptional() : boolean {
        return util.isOptional(this.field.type);
    }

    isArray(): boolean {
        return util.isArray(this.field.type);
    }

    isHashable(): boolean {
        return util.isHashable(this.field.type);
    }

    isPrimitive(): boolean {
        // Implémentation basée sur le type
        return this.getFieldCategory() === FieldCategory.PRIMITIVE;
    }

    isStruct(): boolean {
        return this.getFieldCategory() === FieldCategory.STRUCT;
    }

    isEnum(): boolean {
        return this.getFieldCategory() === FieldCategory.ENUM;
    }

    isOracleAnswer(): boolean {
        return this.getFieldCategory() === FieldCategory.ORACLE_ANSWER;
    }

    hasMask(): boolean {
        return this.field.maskId !== undefined;
    }

    getMask(): number | undefined {
        return this.field.maskId;
    }

    getStructure(): number | undefined {
        return this.field.structType;
    }

    getFieldCategory(): FieldCategory {
        const type = this.field.type;
        if (util.isStruct(type)) {
            if (!this.field.structType) throw new Error('Missing structure type');
            const type = this.field.structType;
            if (type === constants.STRUCT_INTERNAL) return FieldCategory.STRUCT
            if (type === constants.STRUCT_ORACLE) return FieldCategory.ORACLE_ANSWER
        }
        if (util.isEnum(type)) return FieldCategory.ENUM;
        if (util.isPrimitive(type)) return FieldCategory.PRIMITIVE;
        throw new Error(`Undefined field type: ${type}`)
    }
}
