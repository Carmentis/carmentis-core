import * as constants from "../constants/data.js";
import {ENUM, MASKABLE, STRUCT} from "../constants/data.js";

/**
 * Determines if the given type is optional.
 *
 * @param {number} type - The type value to be checked.
 * @return {boolean} Returns true if the type is optional, otherwise false.
 */
export function isOptional( type ) {
    return !!(type & constants.OPTIONAL);
}

/**
 * Determines whether the given type is public.
 *
 * @param {number} type - The type to check for public visibility.
 * @return {boolean} Returns true if the type is public, otherwise false.
 */
export function isPublic( type ) {
    return !isPrivate(type);
}

/**
 * Determines if the given type is private by evaluating it against
 * the PRIVATE constant.
 *
 * @param {number} type - The type value to check against the PRIVATE constant.
 * @return {boolean} Returns true if the type is private, otherwise false.
 */
export function isPrivate( type ) {
    return !!(type & constants.PRIVATE);
}

/**
 * Determines if the given type is an enumeration by checking
 * if the type has the ENUM flag set in its bitmask.
 *
 * @param {number} type - The integer representation of the type to check.
 * @return {boolean} Returns true if the type is an enumeration, otherwise false.
 */
export function isEnum( type )  {
    return !!(type & constants.ENUM)
}

/**
 * Determines if the given type is a structure by checking against a specific flag.
 *
 * @param {number} type - The type to be checked against the structure flag.
 * @return {boolean} Returns true if the type is identified as a structure, otherwise false.
 */
export function isStruct( type ) {
    return !!(type & constants.STRUCT);
}

/**
 * Determines whether a given type is a primitive type or not.
 *
 * @param {number} type - The type to evaluate.
 * @return {boolean} True if the given type is primitive, false otherwise.
 */
export function isPrimitive(type) {
    return !isEnum(type) && !isStruct(type)
}

/**
 * Determines if a given type is hashable.
 *
 * @param {number} type - The type to check for hashability.
 * @return {boolean} Returns true if the type is hashable, otherwise false.
 */
export function isHashable(type) {
    return !!(type & constants.HASHABLE);
}

/**
 * Determines if the given type represents an array.
 *
 * @param {number} type - The type to check for array type.
 * @return {boolean} Returns true if the type is an array, otherwise false.
 */
export function isArray(type) {
    return !!(type & constants.ARRAY);
}

/**
 * Determines whether the given type is required.
 *
 * @param {number} type - The type to check for its required status.
 * @return {boolean} Returns true if the type is required, false otherwise.
 */
export function isRequired(type) {
    return !isOptional(type)
}

/**
 * Retrieves the primitive type from the given type value by applying a mask.
 *
 * @param {number} type - The type value to extract the primitive type from.
 *                        Must be a primitive type, otherwise an error is thrown.
 * @return {number} The primitive type extracted by applying the mask.
 * @throws {Error} If the provided type is not a primitive type.
 */
export function getPrimitiveType(type) {
    if (!isPrimitive(type)) throw new Error("Not a primitive type");
    return type & constants.MSK_PRIMITIVE_TYPE;
}

/**
 * Extracts the type information of the given input.
 *
 * @param {any} type - The type input to be analyzed. It can represent a primitive, structure, or enumeration.
 * @return {number} A numerical representation derived from the type. The number is determined based on whether
 *                  the input is a primitive type, structure, or enumeration. Throws an error if the type is invalid.
 */
export function extractType(type) {
    if (isPrimitive(type)) return getPrimitiveType(type);
    if (isStruct(type)) return STRUCT | getObjectIndex(type);
    if (isEnum(type)) return ENUM | getObjectIndex(type);
    throw new Error('The provided type is  neither a primitive, a structure or an enumeration');
}

/**
 * Calculates the index of an object based on the given type.
 *
 * @param {number} type - The identifier of the object from which the index is derived.
 * @return {number} The calculated index of the object.
 *
 * @throws {Error} If the provided type is a primitive type.
 */
export function getObjectIndex(type) {
    if (isPrimitive(type)) throw new Error('Cannot compute the index of an object for a primitive type.')
    // TODO use the constant
    return type & constants.MSK_OBJECT_INDEX // type  & constants.MSK_OBJECT_INDEX
}

/**
 * Constructs a type value based on the provided properties.
 *
 * @param {Object} properties - The input structure containing type properties.
 * @param {boolean} [properties.public] - Whether the type is public.
 * @param {boolean} [properties.hashable] - Whether the type is hashable.
 * @param {boolean} [properties.optional] - Whether the type is optional.
 * @param {boolean} [properties.array] - Whether the type is an array.
 * @param {boolean} [properties.maskable] - Whether the type is maskable (only valid for primitive types).
 * @param {number} [properties.type] - Used type.
 * @return {number} Returns the constructed type value.
 *
 * @throws {Error} If `index` is supplied for a primitive type or no type is specified.
 */
export function createType(properties) {
    let type = properties.type;
    console.log("1.", type)

    // Handle visibility
    if (!properties.public) {
        type |= constants.PRIVATE; // Set PRIVATE bit

        console.log("2(private).", type)
    }

    // Handle optional and required
    if (properties.optional) {
        type |= constants.OPTIONAL;
        console.log("3(optional).", type)
        if ( !this.isOptional(type) ) throw new Error("Failure to construct optional type")
    }

    // Handle hashable property
    if (properties.hashable) {
        type |= constants.HASHABLE;
        console.log("4(hashable).", type)
    }


    // Handle array property
    if (properties.array) {
        type |= constants.ARRAY;
        console.log("5(array).", type)
        if ( !this.isArray(type) ) throw new Error("Failure to construct array type")
    }


    // handle the mask if primitive
    if ( isPrimitive(type) && properties.maskable ) {
        console.log("6(maskable).", type)
        type |= MASKABLE;
    }

    console.log("7(result).", type)
    return type;
}
