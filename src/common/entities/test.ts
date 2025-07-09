import { DATA } from "../common";
import { z, ZodTypeAny, ZodObject, ZodArray, ZodNumber, ZodString, ZodBoolean, ZodType, ZodEffects } from "zod";

function getBaseType(zod: ZodTypeAny): number {
    if (zod instanceof ZodString) return DATA.TYPE_STRING;
    if (zod instanceof ZodBoolean) return DATA.TYPE_BOOLEAN;
    if (zod instanceof ZodNumber) return DATA.TYPE_UINT8;
    if (zod._def.ctor === Uint8Array) return DATA.TYPE_BIN256;

    return -1; // Unknown type
}

export function zodToVBState(zodSchema: ZodObject<any>): any[] {
    const fields: any[] = [];

    const shape = zodSchema.shape;

    for (const [key, value] of Object.entries(shape)) {
        const real = value instanceof ZodEffects ? value._def.schema : value;

        if (real instanceof ZodObject) {
            fields.push({
                name: key,
                type: DATA.TYPE_OBJECT,
                schema: zodToVBState(real)
            });
        } else if (real instanceof ZodArray) {
            const item = real._def.type;
            if (item instanceof ZodObject) {
                fields.push({
                    name: key,
                    type: DATA.TYPE_ARRAY_OF | DATA.TYPE_OBJECT,
                    schema: zodToVBState(item)
                });
            } else {
                fields.push({
                    name: key,
                    type: DATA.TYPE_ARRAY_OF | getBaseType(item)
                });
            }
        } else {
            fields.push({
                name: key,
                type: getBaseType(real)
            });
        }
    }

    return fields;
}



