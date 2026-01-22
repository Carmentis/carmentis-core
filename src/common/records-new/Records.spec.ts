import {Record} from "./Record";
import {FlattenedRecord} from "./FlattenedRecord";
import {MerkleRecord} from "./MerkleRecord";

describe("Record", () => {
    it('testing Record methods', async () => {
        const json = `{ "firstname": "Joe", "lastname": "Doo", "email": "john.doe@gmail.com", "object": { "foo": 123, "bar": [ 456, "hello" ] } }`;
        const jsonObject = JSON.parse(json);
        jsonObject.foo = new Date;
        const record = new Record;
        record.fromJson(jsonObject);
        console.log(record.toJson());
        const flattenedRecord = new FlattenedRecord;
        flattenedRecord.fromRecord(record);
        const merkleRecord = new MerkleRecord;
        merkleRecord.fromFlattenedRecord(flattenedRecord);
    });
})
