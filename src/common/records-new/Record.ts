import * as v from 'valibot';
import {
    Path,
    MaskPart,
    JsonData,
    JsonSchema,
    Json,
    TransformationTypeEnum,
    TypeEnum,
    Item,
    StringItem,
    NumberItem,
    BooleanItem,
    NullItem,
    ArrayItem,
    ObjectItem,
} from './types';

export class Record {
    private tree: Item;

    constructor() {
        this.tree = this.buildNullItem();
    }

    fromJson(object: unknown) {
        const parsedObject = v.parse(JsonSchema, object);
        this.tree = this.buildTreeByDfs(parsedObject);
    }

    toJson() {
        return this.buildJsonByDfs(this.tree);
    }

    /**
     * Sets the channel ID of a field identified by its path.
     */
    setChannel(path: Path, channelId: number) {
        const field = this.getFieldByPath(path);
        field.channelId = channelId;
    }

    /**
     * Sets a field identified by its path as hashable.
     */
    setAsHashable(path: Path) {
        const field = this.getFieldByPath(path);
        if (field.type !== TypeEnum.String) {
            throw new Error('only a string may be set as hashable');
        }
        field.transformation = { type: TransformationTypeEnum.Hashable };
    }

    /**
     * Sets a mask on a field identified by its path, using an array of mask parts. Each mask part is
     * defined as { start, end, replacement } where 'start' and 'end' are the 0-based indices of the
     * masked part and 'replacement' the replacement string when this part is not revealed.
     */
    setMask(path: Path, maskParts: MaskPart[]) {
        const field = this.getFieldByPath(path);
        if (field.type !== TypeEnum.String) {
            throw new Error('a mask may only be applied to a string');
        }

        const visibleParts: string[] = [];
        const hiddenParts: string[] = [];

        // sort the parts by 'start' positions
        maskParts.sort((a, b) => a.start - b.start);

        maskParts.forEach((maskPart, i) => {
            const prevStart = i > 0 ? maskParts[i - 1].start : 0;
            const prevEnd = i > 0 ? maskParts[i - 1].end : 0;

            if (maskPart.start < 0 || maskPart.start >= field.value.length || maskPart.end <= maskPart.start) {
                throw `invalid interval [${[maskPart.start, maskPart.end]}]`;
            }
            if (maskPart.start < prevEnd) {
                throw `overlapping intervals [${[prevStart, prevEnd]}] and [${[maskPart.start, maskPart.end]}]`;
            }

            const hiddenPart = field.value.slice(maskPart.start, maskPart.end);

            if (i && maskPart.start == prevEnd) {
                visibleParts[visibleParts.length - 1] += maskPart.replacement;
                hiddenParts[hiddenParts.length - 1] += hiddenPart;
            }
            else {
                visibleParts.push(field.value.slice(prevEnd, maskPart.start), maskPart.replacement);
                hiddenParts.push(hiddenPart);
            }
            if (i == maskParts.length - 1 && maskPart.end < field.value.length) {
                visibleParts.push(field.value.slice(maskPart.end));
            }
        });

        field.transformation = { type: TransformationTypeEnum.Maskable, visibleParts, hiddenParts };
    }

    /**
     * Sets a mask on a field identified by its path, using a regular expression and a substitution
     * string. The regular expression must capture all parts of the string. The substitution string
     * is a mix of replacement strings and references to the captured groups with $x.
     * Example: /^(.)(.*)(@.)(.*)$/ and '$1***$3***' applied to 'john.do@gmail.com' will produce
     * 'j***@g***'.
     */
    setMaskByRegex(path: Path, regex: RegExp, substitutionString: string) {
        const field = this.getFieldByPath(path);
        if (field.type !== TypeEnum.String) {
            throw new Error('a mask may only be applied to a string');
        }

        const stringParts = (regex.exec(field.value) || []).slice(1);

        if(stringParts.join("") != field.value) {
            throw `the regular expression ${regex} does not capture all string parts`;
        }

        const substitutionParts =
            substitutionString.split(/(\$\d+)/)
            .map((string, i) => ({ shown: !!(i & 1), string }))
            .filter((part) => part.string != '');

        if(
            substitutionParts.length != stringParts.length ||
            substitutionParts.some((part, i) => part.shown && part.string != "$" + (i + 1))
        ) {
            throw `invalid substitution string "${substitutionString}"`;
        }

        const markParts: MaskPart[] = [];
        let ptr = 0;

        substitutionParts.forEach((part, i) => {
            const newPtr = ptr + stringParts[i].length;

            if(!part.shown) {
                markParts.push({
                    start: ptr,
                    end: newPtr,
                    replacement: part.string
                });
            }
            ptr = newPtr;
        });
        this.setMask(path, markParts);
    }

    getTree() {
        return this.tree;
    }

    private getFieldByPath(path: Path): Item {
        let field: Item = this.tree;
        for (const part of path) {
            if (typeof part == 'string' && field.type == TypeEnum.Object) {
                field = field.value.find((item: Item) => item.key == part);
                field = field?.value;
            }
            else if (typeof part == 'number' && field.type == TypeEnum.Array) {
                field = field.value[part];
            }
            else {
                throw new Error('invalid path');
            }
            if (field === undefined) {
                throw new Error('invalid path');
            }
        }
        if (field.type == TypeEnum.Object || field.type == TypeEnum.Array) {
            throw new Error('incomplete path');
        }
        return field;
    }

    private buildJsonByDfs(item: Item): JsonData {
        switch (item.type) {
            case TypeEnum.Array: {
                const value = (item as ArrayItem).value;
                return value.map((item) => this.buildJsonByDfs(item));
            }
            case TypeEnum.Object: {
                const object: { [key: string]: any } = {};
                const value = (item as ObjectItem).value;
                for (const entry of value) {
                    object[entry.key] = this.buildJsonByDfs(entry.value);
                }
                return object;
            }
            default: {
                return item.value;
            }
        }
    }

    static getValueType(field: Json) {
        if (typeof field == 'string') {
            return TypeEnum.String;
        }
        if (typeof field == 'number') {
            return TypeEnum.Number;
        }
        if (typeof field == 'boolean') {
            return TypeEnum.Boolean;
        }
        if (field === null) {
            return TypeEnum.Null;
        }
        if (Array.isArray(field)) {
            return TypeEnum.Array;
        }
        if (typeof field == 'object' && Object.getPrototypeOf(field).isPrototypeOf(Object)) {
            return TypeEnum.Object;
        }
        throw new Error('unsupported field type');
    }

    static getPrimitiveValueType(field: Json) {
        const type = Record.getValueType(field);
        if (type == TypeEnum.Array || type == TypeEnum.Object) {
            throw new Error(`expected a primitive value, got an array or an object`);
        }
        return type;
    }

    private buildTreeByDfs(field: Json): Item {
        const type = Record.getValueType(field);
        switch (type) {
            case TypeEnum.String: {
                return this.buildStringItem(field as string);
            }
            case TypeEnum.Number: {
                return this.buildNumberItem(field as number);
            }
            case TypeEnum.Boolean: {
                return this.buildBooleanItem(field as boolean);
            }
            case TypeEnum.Null: {
                return this.buildNullItem();
            }
            case TypeEnum.Array: {
                return this.buildArrayItem(field as Json[]);
            }
            case TypeEnum.Object: {
                return this.buildObjectItem(field as {[key: string]: Json});
            }
        }
        throw new Error('unsupported field type');
    }

    private buildStringItem(field: string): StringItem {
        return {
            type: TypeEnum.String,
            value: field,
            transformation: { type: TransformationTypeEnum.None },
            channelId: -1,
        };
    }

    private buildNumberItem(field: number): NumberItem {
        return {
            type: TypeEnum.Number,
            value: field,
            channelId: -1,
        };
    }

    private buildBooleanItem(field: boolean): BooleanItem {
        return {
            type: TypeEnum.Boolean,
            value: field,
            channelId: -1,
        };
    }

    private buildNullItem(): NullItem {
        return {
            type: TypeEnum.Null,
            value: null,
            channelId: -1,
        };
    }

    private buildArrayItem(field: Item[]): ArrayItem {
        return {
            type: TypeEnum.Array,
            value: field.map((field) => this.buildTreeByDfs(field)),
        };
    }

    private buildObjectItem(field: { [key: string]: Item }): ObjectItem {
        const value = Object.keys(field).map((key) => ({
            key,
            value: this.buildTreeByDfs(field[key]),
        }));
        return {
            type: TypeEnum.Object,
            value,
        };
    }
}
