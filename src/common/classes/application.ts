import {Field} from "./field";

export interface MaskInterface {
    name: string;
    regex: string;
    substitution: string;
}

export interface EnumerationInterface {
    name: string;
    values: string[];
}

export interface OracleAnswerInterface {
    oracle: string;
    version: number;
    serviceName: string;
}

export interface StructureInterface {
    name: string;
    properties: FieldInterface[];
}

export interface ApplicationMessageInterface {
    name: string;
    content: string;
}

export interface ApplicationDefinitionInterface {
    fields: FieldInterface[];
    internalStructures: StructureInterface[];
    oracleStructures: OracleAnswerInterface[];
    messages: ApplicationMessageInterface[];
    enumerations: EnumerationInterface[];
    masks: MaskInterface[];
}

export interface OracleServiceInterface {
    name: string;
    request: FieldInterface[];
    answer: FieldInterface[];
}

export interface OracleDefinitionInterface {
    services: OracleServiceInterface[];
    internalStructures: StructureInterface[];
    enumerations: EnumerationInterface[];
    masks: MaskInterface[];
}

export interface ApplicationVersionInterface {
    version: number;
    definition: ApplicationDefinitionInterface;
}

export interface ApplicationDescriptionInterface {
    name: string;
    logoUrl: string;
    homepageUrl: string;
    rootDomain: string;
    description: string;
}

export class Mask {
    constructor(
        private readonly name: string,
        private readonly regex: string,
        private readonly substitution: string
    ) {
    }

    getName(): string {
        return this.name;
    }

    getRegex(): string {
        return this.regex;
    }

    getSubstitution(): string {
        return this.substitution;
    }

    static build(data: MaskInterface): Mask {
        if (
            typeof data.name !== 'string' ||
            typeof data.regex !== 'string' ||
            typeof data.substitution !== 'string'
        ) {
            throw new Error('Invalid MaskInterface structure');
        }
        return new Mask(data.name, data.regex, data.substitution);
    }
}

export class Enumeration {
    constructor(
        private readonly name: string,
        private readonly values: string[]
    ) {
    }

    getName(): string {
        return this.name;
    }

    getValues(): string[] {
        return this.values;
    }

    static build(data: EnumerationInterface): Enumeration {
        if (typeof data.name !== 'string' || !Array.isArray(data.values)) {
            throw new Error('Invalid EnumerationInterface structure');
        }
        return new Enumeration(data.name, data.values);
    }
}

export class OracleAnswer {
    constructor(
        private readonly oracle: string,
        private readonly version: number,
        private readonly serviceName: string
    ) {
    }

    getOracle(): string {
        return this.oracle;
    }

    getVersion(): number {
        return this.version;
    }

    getServiceName(): string {
        return this.serviceName;
    }

    static build(data: OracleAnswerInterface): OracleAnswer {
        if (
            typeof data.oracle !== 'string' ||
            typeof data.version !== 'number' ||
            typeof data.serviceName !== 'string'
        ) {
            throw new Error('Invalid OracleAnswerInterface structure');
        }
        return new OracleAnswer(data.oracle, data.version, data.serviceName);
    }
}

export class ApplicationMessage {
    constructor(
        private readonly name: string,
        private readonly content: string
    ) {
    }

    getName(): string {
        return this.name;
    }

    getContent(): string {
        return this.content;
    }

    static build(data: ApplicationMessageInterface): ApplicationMessage {
        if (
            typeof data.name !== 'string' ||
            typeof data.content !== 'string'
        ) {
            throw new Error('Invalid ApplicationMessageInterface structure');
        }
        return new ApplicationMessage(data.name, data.content);
    }
}


export class Structure {
    constructor(
        private readonly name: string,
        private readonly properties: Field[]
    ) {
    }

    getName(): string {
        return this.name;
    }

    getProperties(): Field[] {
        return this.properties;
    }

    static build(data: StructureInterface): Structure {
        if (
            typeof data.name !== 'string' ||
            !Array.isArray(data.properties)
        ) {
            throw new Error('Invalid StructureInterface structure');
        }

        return new Structure(
            data.name,
            data.properties.map((property) => Field.build(property))
        );
    }
}

export class ApplicationDefinition {
    constructor(
        private readonly fields: Field[],
        private readonly internalStructures: Structure[],
        private readonly oracleStructures: OracleAnswer[],
        private readonly messages: ApplicationMessage[],
        private readonly enumerations: Enumeration[],
        private readonly masks: Mask[]
    ) {
    }

    getFields(): Field[] {
        return this.fields;
    }

    getInternalStructures(): Structure[] {
        return this.internalStructures;
    }

    getOracleStructures(): OracleAnswer[] {
        return this.oracleStructures;
    }

    getMessages(): ApplicationMessage[] {
        return this.messages;
    }

    getEnumerations(): Enumeration[] {
        return this.enumerations;
    }

    getMasks(): Mask[] {
        return this.masks;
    }

    static build(data: ApplicationDefinitionInterface): ApplicationDefinition {
        if (
            !Array.isArray(data.fields) ||
            !Array.isArray(data.internalStructures) ||
            !Array.isArray(data.oracleStructures) ||
            !Array.isArray(data.messages) ||
            !Array.isArray(data.enumerations) ||
            !Array.isArray(data.masks)
        ) {
            throw new Error('Invalid ApplicationDefinitionInterface structure');
        }

        return new ApplicationDefinition(
            data.fields.map((field) => Field.build(field)),
            data.internalStructures.map((structure) =>
                Structure.build(structure)
            ),
            data.oracleStructures.map((oracleAnswer) =>
                OracleAnswer.build(oracleAnswer)
            ),
            data.messages.map((message) => ApplicationMessage.build(message)),
            data.enumerations.map((enumeration) => Enumeration.build(enumeration)),
            data.masks.map((mask) => Mask.build(mask))
        );
    }
}

import {FieldInterface} from "./field-interface";


export interface MicroBlockContentInterface {
    header: {
        magicString: string;
        protocolVersion: number;
        height: number;
        previousHash: string;
        timestamp: number;
        gas: number;
        gasPrice: number;
    };
    sections: {
        id: number;
        label: string;
        size: number;
    }[];
}

export class MicroBlock {
    constructor(
        private readonly header: {
            magicString: string;
            protocolVersion: number;
            height: number;
            previousHash: string;
            timestamp: number;
            gas: number;
            gasPrice: number;
        },
        private readonly sections: {
            id: number;
            label: string;
            size: number;
        }[]
    ) {
    }


    public getHeight(): number {
        return this.header.height;
    }

    public getPreviousHash(): string {
        return this.header.previousHash;
    }

    getTimestamp(): number {
        return this.header.timestamp * 1000;
    }

    getGas(): number {
        return this.header.gas;
    }

    getGasPrice(): number {
        return this.header.gasPrice;
    }

    getNumberOfSections(): number {
        return this.sections.length;
    }

    getSectionId(index: number): number {
        if (index < 0 || index >= this.sections.length) {
            throw new Error('Section index out of bounds');
        }
        return this.sections[index].id;
    }

    getSectionLabel(index: number): string {
        if (index < 0 || index >= this.sections.length) {
            throw new Error('Section index out of bounds');
        }
        return this.sections[index].label;
    }

    getSectionSize(index: number): number {
        if (index < 0 || index >= this.sections.length) {
            throw new Error('Section index out of bounds');
        }
        return this.sections[index].size;
    }

    /**
     * Constructs a new instance of the `MicroBlock` class based on the provided `MicroBlockContentInterface` data.
     * Validates the structure of the input data before instantiation.
     *
     * @param {MicroBlockContentInterface} data - The input object containing the header and sections information for the `MicroBlock`.
     * @param {Object} data.header - The header information of the MicroBlock.
     * @param {string} data.header.magicString - The magic string identifying the block.
     * @param {number} data.header.protocolVersion - The protocol version of the block.
     * @param {number} data.header.height - The height of the block in the chain.
     * @param {string} data.header.previousHash - The hash of the previous block in the chain.
     * @param {number} data.header.timestamp - The timestamp signifying when the block was created.
     * @param {number} data.header.gas - The total gas used within the block.
     * @param {number} data.header.gasPrice - The gas price at the time of block creation.
     * @param {Array} data.sections - An array containing section objects of the MicroBlock.
     * @param {number} data.sections[].id - The unique identifier of each section in the block.
     * @param {string} data.sections[].label - The descriptive label of each section.
     * @param {number} data.sections[].size - The size of each section in the block.
     *
     * @return {MicroBlock} The `MicroBlock` instance built from the validated input data.
     * @throws {Error} If `data` does not match the expected structure of `MicroBlockContentInterface`.
     */
    static build(data: MicroBlockContentInterface): MicroBlock {
        if (
            typeof data.header !== 'object' ||
            typeof data.header.magicString !== 'string' ||
            typeof data.header.protocolVersion !== 'number' ||
            typeof data.header.height !== 'number' ||
            typeof data.header.previousHash !== 'string' ||
            typeof data.header.timestamp !== 'number' ||
            typeof data.header.gas !== 'number' ||
            typeof data.header.gasPrice !== 'number' ||
            !Array.isArray(data.sections) ||
            !data.sections.every(
                (section) =>
                    typeof section.id === 'number' &&
                    typeof section.label === 'string' &&
                    typeof section.size === 'number'
            )
        ) {
            throw new Error('Invalid MicroBlockContentInterface structure');
        }

        return new MicroBlock(data.header, data.sections);
    }
}

