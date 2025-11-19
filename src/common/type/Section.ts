/**
 * Represents a section within a microblock containing data and metadata.
 * @template T - The type of object stored in the section
 */
export interface Section<T = any> {
    /** The type identifier for this section */
    type: number,
    /** The deserialized object stored in this section */
    object: T,
    /** The raw serialized data of this section */
    data: Uint8Array,
    /** The hash of this section's data */
    hash: Uint8Array,
    /** The index position of this section within the microblock */
    index: number,
}